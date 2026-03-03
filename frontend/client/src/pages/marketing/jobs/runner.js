// v4.50.0: job runner with DB lock + retry/backoff (one-shot).
// Production: run in worker process; use stronger locks/transactions.

function backoffMinutes(attempt){
  // 1, 3, 10 minutes
  if(attempt <= 1) return 1;
  if(attempt == 2) return 3;
  return 10;
}

async function lockNextJob(ctx){
  // Claim one due job atomically (best-effort)
  const job = await ctx.db.selectOne(
    `SELECT * FROM marketing_jobs
     WHERE org_id=? AND status='queued' AND run_at <= NOW()
       AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))
     ORDER BY run_at ASC LIMIT 1`,
    [ctx.org_id]
  );
  if(!job) return null;

  const lock_key = `job:${job.id}`;
  await ctx.db.run(
    `UPDATE marketing_jobs SET status='running', lock_key=?, locked_at=NOW(), attempts=attempts+1
     WHERE id=? AND status='queued'`,
    [lock_key, job.id]
  );

  // re-read to ensure claimed
  return await ctx.db.selectOne(`SELECT * FROM marketing_jobs WHERE id=? LIMIT 1`, [job.id]);
}

async function markDone(ctx, job_id){
  await ctx.db.run(`UPDATE marketing_jobs SET status='done' WHERE id=?`, [job_id]);
}

async function markFailed(ctx, job, err){
  const attempts = Number(job.attempts||1);
  const max_attempts = Number(job.max_attempts||3);
  const msg = String((err && err.message) || err || 'error').slice(0,255);

  if(attempts >= max_attempts){
    await ctx.db.run(`UPDATE marketing_jobs SET status='failed', last_error=? WHERE id=?`, [msg, job.id]);
    return { ok:false, terminal:true };
  }

  const mins = backoffMinutes(attempts);
  await ctx.db.run(
    `UPDATE marketing_jobs SET status='queued', last_error=?, run_at=DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id=?`,
    [msg, mins, job.id]
  );
  return { ok:false, terminal:false, retry_in_minutes: mins };
}

// Minimal audit NOTE: bundle stays self-contained.
// In Ghaith core, replace this with Kernel audit service.
async function auditJob(ctx, action, meta){
  try{
    if(typeof ctx.audit === 'function'){
      const out = await ctx.audit({ action, meta });
      return out && out.id ? out.id : null;
    }
  }catch(e){}
  return null;
}

async function runJob(ctx, job){
  const payload = job.payload_json ? JSON.parse(job.payload_json) : {};
  if(job.job_type === 'campaign_publish'){
    const { generateCampaignAssets } = require('../services/campaign_assets.service');
    const { createSnapshot } = require('../../public_site/blocks/services/snapshots.service');

    // ensure assets exist
    const asset = await ctx.db.selectOne(
      `SELECT id FROM marketing_campaign_assets WHERE org_id=? AND campaign_id=? AND asset_type='landing_blocks' ORDER BY id DESC LIMIT 1`,
      [ctx.org_id, payload.campaign_id]
    );
    if(!asset){
      await generateCampaignAssets(ctx, payload.campaign_id, payload.input||{});
    }

    if(payload.page_id){
      const a = await ctx.db.selectOne(
        `SELECT content_json FROM marketing_campaign_assets WHERE org_id=? AND campaign_id=? AND asset_type='landing_blocks' ORDER BY id DESC LIMIT 1`,
        [ctx.org_id, payload.campaign_id]
      );
      const blocks = a ? (JSON.parse(a.content_json||'{}').blocks||[]) : [];

      const row = await ctx.db.selectOne(`SELECT content_json, website_id FROM public_pages WHERE org_id=? AND id=? LIMIT 1`, [ctx.org_id, payload.page_id]);
      if(row){
        const cj = JSON.parse(row.content_json||'{}');
        cj.blocks = blocks;
        await ctx.db.run(`UPDATE public_pages SET content_json=?, updated_at=NOW() WHERE org_id=? AND id=?`, [JSON.stringify(cj), ctx.org_id, payload.page_id]);

        // snapshot + versioning
        const last = await ctx.db.selectOne(
          `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='page' AND entity_id=? ORDER BY id DESC LIMIT 1`,
          [ctx.org_id, payload.page_id]
        );
        const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);
        await createSnapshot(ctx,{
          website_id: row.website_id||null,
          entity_type:'page',
          entity_id: Number(payload.page_id),
          version_no: nextVer,
          content_json: cj
        });
      }
    }

    const audit_id = await auditJob(ctx,'marketing.job.campaign_publish',{ job_id: job.id, campaign_id: payload.campaign_id, page_id: payload.page_id||null });
    if(audit_id){
      await ctx.db.run(`UPDATE marketing_jobs SET last_audit_id=? WHERE id=?`, [audit_id, job.id]);
    }
  }
  return { ok:true };
}

async function runOnce(ctx){
  const job = await lockNextJob(ctx);
  if(!job) return { ok:true, ran:false };

  try{
    await runJob(ctx, job);
    await markDone(ctx, job.id);
    return { ok:true, ran:true, job_id: job.id };
  }catch(e){
    const r = await markFailed(ctx, job, e);
    return { ok:false, ran:true, job_id: job.id, error:String(e), ...r };
  }
}

module.exports = { runOnce };
