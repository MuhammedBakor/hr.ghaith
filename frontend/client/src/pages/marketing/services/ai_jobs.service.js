const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }

async function createJob(ctx, { job_type, prompt, input_json }){
  const id = uuid();
  await ctx.db.run(
    `INSERT INTO marketing_ai_jobs (id, org_id, website_id, branch_id, job_type, prompt, input_json, status, created_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
    [id, ctx.org_id, ctx.website_id, ctx.branch_id || null, job_type, prompt, JSON.stringify(input_json||{}), 'QUEUED', ctx.actor_id || null]
  );
  return { ok:true, id, status:'QUEUED' };
}

async function listJobs(ctx, { website_id, status }){
  const rows = await ctx.db.selectMany(
    `SELECT id, job_type, status, created_at, updated_at, error_text
     FROM marketing_ai_jobs WHERE website_id=? ${status ? "AND status=?" : ""}
     ORDER BY created_at DESC LIMIT 200`,
    status ? [website_id, status] : [website_id]
  );
  return { ok:true, rows };
}

async function readJob(ctx, { id }){
  const row = await ctx.db.selectOne(
    `SELECT id, job_type, prompt, input_json, output_json, status, error_text, created_at, updated_at
     FROM marketing_ai_jobs WHERE website_id=? AND id=? LIMIT 1`,
    [ctx.website_id, id]
  );
  if(!row) throw new Error('NOT_FOUND');
  return { ok:true, job: {
    id: row.id, job_type: row.job_type, status: row.status, error_text: row.error_text,
    prompt: row.prompt,
    input_json: JSON.parse(row.input_json || '{}'),
    output_json: JSON.parse(row.output_json || 'null')
  }};
}

module.exports = { createJob, listJobs, readJob };
