
const { generateImage } = require('./image_provider.placeholder');
const { saveMediaAsset } = require('./media_assets.service');

async function runNextContentJob(ctx){
  // Keep old NOTE behavior: only state machine; AI provider comes later
  const job = await ctx.db.selectOne(
    `SELECT * FROM marketing_content_jobs WHERE org_id=? AND status='QUEUED' ORDER BY created_at ASC LIMIT 1`,
    [ctx.org_id]
  );
  if(!job) return { ok:true, skipped:true };
  await ctx.db.run(`UPDATE marketing_content_jobs SET status='RUNNING', updated_at=NOW() WHERE id=?`, [job.id]);

  const out = {
    title: 'نص تسويقي (تجريبي)',
    excerpt: 'ملخص قصير (تجريبي).',
    body: 'هذا مخرج تجريبي لتأكيد مسار JOBS + APPLY. سيتم ربطه بمولّد فعلي لاحقًا.',
    blocks: [{ type:'hero', data:{ title:'عنوان', subtitle:'وصف مختصر' } }]
  };

  await ctx.db.run(
    `UPDATE marketing_content_jobs SET status='DONE', output_json=?, updated_at=NOW() WHERE id=?`,
    [JSON.stringify(out), job.id]
  );
  return { ok:true, id: job.id, status:'DONE' };
}

async function runNextImageJob(ctx){
  const job = await ctx.db.selectOne(
    `SELECT * FROM marketing_image_jobs WHERE org_id=? AND status='QUEUED' ORDER BY created_at ASC LIMIT 1`,
    [ctx.org_id]
  );
  if(!job) return { ok:true, skipped:true };

  await ctx.db.run(`UPDATE marketing_image_jobs SET status='RUNNING', updated_at=NOW() WHERE id=?`, [job.id]);

  try{
    const style = job.style_json ? JSON.parse(job.style_json) : {};
    const img = await generateImage({ prompt: job.prompt, style_json: style });

    // Integration point for file storage:
    const fakePath = `/uploads/public_site/${job.website_id}/${img.file_name}`;
    const asset = await saveMediaAsset(ctx,{
      website_id: job.website_id,
      file_name: img.file_name,
      mime_type: img.mime_type,
      size_bytes: img.bytes.length,
      path: fakePath
    });

    await ctx.db.run(
      `UPDATE marketing_image_jobs SET status='DONE', output_media_asset_id=?, updated_at=NOW() WHERE id=?`,
      [asset.id, job.id]
    );
    return { ok:true, id: job.id, status:'DONE', media_asset_id: asset.id };
  }catch(e){
    await ctx.db.run(
      `UPDATE marketing_image_jobs SET status='FAILED', error_text=?, updated_at=NOW() WHERE id=?`,
      [String(e && e.message || e).slice(0,600), job.id]
    );
    return { ok:false, id: job.id, status:'FAILED' };
  }
}

module.exports = { runNextContentJob, runNextImageJob };
