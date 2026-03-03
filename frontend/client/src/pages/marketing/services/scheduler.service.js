
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

function parseDueFromSchedule(schedule_json){
  // Minimal: if schedule_json.next_at provided use it else now+5min
  const now = new Date();
  if(schedule_json && schedule_json.next_at){
    const d = new Date(schedule_json.next_at);
    if(!isNaN(d.getTime())) return d;
  }
  return new Date(now.getTime() + 5*60*1000);
}

async function enqueueFromCampaign(ctx, campaign_id, kind, payload){
  const row = await ctx.db.selectOne(
    `SELECT id, website_id, branch_id, schedule_json FROM marketing_campaigns WHERE org_id=? AND id=? LIMIT 1`,
    [ctx.org_id, campaign_id]
  );
  if(!row) return { ok:false, error:'CAMPAIGN_NOT_FOUND' };

  const schedule = JSON.parse(row.schedule_json||'{}');
  const due = parseDueFromSchedule(schedule);
  const id = uuid();
  const now = nowSql();

  await ctx.db.run(
    `INSERT INTO marketing_scheduler_queue
     (id, org_id, branch_id, website_id, campaign_id, task_type, payload_json, due_at, status, created_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, ctx.org_id, row.branch_id||null, row.website_id||null, campaign_id, kind, JSON.stringify(payload||{}),
     due.toISOString().slice(0,19).replace('T',' '),
     'QUEUED', ctx.actor_id||null, now, now]
  );
  return { ok:true, id, due_at: due.toISOString() };
}

async function runNextScheduled(ctx){
  const task = await ctx.db.selectOne(
    `SELECT * FROM marketing_scheduler_queue
     WHERE org_id=? AND status='QUEUED' AND due_at <= NOW()
     ORDER BY due_at ASC LIMIT 1`,
    [ctx.org_id]
  );
  if(!task) return { ok:true, skipped:true };

  await ctx.db.run(`UPDATE marketing_scheduler_queue SET status='RUNNING', updated_at=NOW() WHERE id=?`, [task.id]);

  // Translate scheduled task into actual jobs
  const payload = JSON.parse(task.payload_json||'{}');
  if(task.task_type === 'content_job'){
    const jid = uuid(); const now = nowSql();
    await ctx.db.run(
      `INSERT INTO marketing_content_jobs
       (id, org_id, branch_id, website_id, campaign_id, target_type, target_id, prompt, inputs_json, output_json, status, apply_action, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        jid, ctx.org_id, task.branch_id||null, task.website_id||null, task.campaign_id,
        payload.target_type||'ad_copy', payload.target_id||null,
        payload.prompt||null,
        JSON.stringify(payload.inputs_json||{}),
        NULL,
        'QUEUED',
        payload.apply_action||null,
        ctx.actor_id||null,
        now, now
      ]
    );
  } else if(task.task_type === 'image_job'){
    const jid = uuid(); const now = nowSql();
    await ctx.db.run(
      `INSERT INTO marketing_image_jobs
       (id, org_id, branch_id, website_id, campaign_id, purpose, prompt, style_json, status, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        jid, ctx.org_id, task.branch_id||null, task.website_id||null, task.campaign_id,
        payload.purpose||null,
        payload.prompt||null,
        JSON.stringify(payload.style_json||{}),
        'QUEUED',
        ctx.actor_id||null,
        now, now
      ]
    );
  }

  await ctx.db.run(`UPDATE marketing_scheduler_queue SET status='DONE', updated_at=NOW() WHERE id=?`, [task.id]);
  return { ok:true, id: task.id, status:'DONE' };
}

module.exports = { enqueueFromCampaign, runNextScheduled };
