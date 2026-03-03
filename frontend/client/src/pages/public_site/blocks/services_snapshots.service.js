const crypto = require('crypto');

function makeDocNo(prefix='PUB'){
  const ts = new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
  const rnd = Math.random().toString(16).slice(2,8).toUpperCase();
  return `${prefix}-${ts}-${rnd}`;
}

function sha256(str){
  return crypto.createHash('sha256').update(String(str||'')).digest('hex');
}

async function createSnapshot(ctx, input){
  const doc_no = makeDocNo('PUB');
  const payload = JSON.stringify({
    org_id: ctx.org_id,
    website_id: input.website_id||null,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    version_no: input.version_no||1,
    content_json: input.content_json||null,
    theme_json: input.theme_json||null,
    seo_json: input.seo_json||null,
    visibility_json: input.visibility_json||null
  });

  const hash = sha256(payload);

  await ctx.db.run(
    `INSERT INTO public_content_snapshots
     (org_id, branch_id, website_id, entity_type, entity_id, version_no, doc_no, hash_sha256, content_json, theme_json, seo_json, visibility_json, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      ctx.org_id, ctx.branch_id||null, input.website_id||null,
      input.entity_type, input.entity_id, input.version_no||1,
      doc_no, hash,
      input.content_json ? JSON.stringify(input.content_json) : null,
      input.theme_json ? JSON.stringify(input.theme_json) : null,
      input.seo_json ? JSON.stringify(input.seo_json) : null,
      input.visibility_json ? JSON.stringify(input.visibility_json) : null,
      ctx.actor_id||null
    ]
  );

  return { ok:true, doc_no, hash_sha256: hash };
}

async function listSnapshots(ctx, entity_type, entity_id){
  const rows = await ctx.db.selectAll(
    `SELECT id, doc_no, version_no, hash_sha256, created_at, created_by
     FROM public_content_snapshots
     WHERE org_id=? AND entity_type=? AND entity_id=?
     ORDER BY id DESC LIMIT 50`,
    [ctx.org_id, entity_type, entity_id]
  );
  return { ok:true, items: rows||[] };
}

module.exports = { createSnapshot, listSnapshots };
