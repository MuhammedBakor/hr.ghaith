async function ensureTable(ctx){
  await ctx.db.run(`CREATE TABLE IF NOT EXISTS marketing_ai_image_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    branch_id BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    prompt_text TEXT NOT NULL,
    meta_json JSON NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    INDEX idx_img_req (org_id, status, created_at)
  )`);
}

async function createRequest(ctx, { branch_id=null, prompt, meta=null }){
  await ensureTable(ctx);
  const r = await ctx.db.run(
    `INSERT INTO marketing_ai_image_requests (org_id, branch_id, prompt_text, meta_json, created_by)
     VALUES (?,?,?,?,?)`,
    [ctx.org_id, branch_id, String(prompt||''), meta ? JSON.stringify(meta) : null, ctx.actor_id||null]
  );
  return { ok:true, id: (r && (r.insertId || r.lastID)) || null };
}

module.exports = { ensureTable, createRequest };
