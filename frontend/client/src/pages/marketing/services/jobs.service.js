async function enqueueJob(ctx, job_type, run_at, payload){
  await ctx.db.run(
    `INSERT INTO marketing_jobs (org_id, branch_id, job_type, run_at, payload_json)
     VALUES (?,?,?,?,?)`,
    [ctx.org_id, ctx.branch_id||null, job_type, run_at, payload ? JSON.stringify(payload) : null]
  );
  return { ok:true };
}

module.exports = { enqueueJob };
