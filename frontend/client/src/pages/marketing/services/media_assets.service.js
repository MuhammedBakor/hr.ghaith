
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

/**
 * saveMediaAsset(ctx, { website_id, file_name, mime_type, bytes })
 * Stores record in public_media_assets and writes file under /uploads/public_site/<website_id>/<id>.<ext>
 * NOTE: in this bundle we keep file write optional (filesystem integration point).
 */
async function saveMediaAsset(ctx, { website_id, file_name, mime_type, size_bytes, path }){
  const id = uuid();
  const now = nowSql();
  await ctx.db.run(
    `INSERT INTO public_media_assets (id, org_id, website_id, file_name, mime_type, size_bytes, path, status, created_by, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, ctx.org_id, website_id, file_name||null, mime_type||null, size_bytes||0, path||null, 'UPLOADED', ctx.actor_id||null, now]
  );
  return { id };
}

module.exports = { saveMediaAsset };
