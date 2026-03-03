const crypto = require('crypto');

function sha256(buf){
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isAllowed(mime, ext, policy){
  const allowedMime = new Set((policy.allowed_mime||[]).map(String));
  const allowedExt = new Set((policy.allowed_ext||[]).map(s=>String(s).toLowerCase()));
  if(mime && !allowedMime.has(mime)) return false;
  if(ext && !allowedExt.has(String(ext).toLowerCase())) return false;
  return true;
}

function defaultPolicy(){
  return {
    max_file_size_mb: 8,
    max_files_per_request: 5,
    allowed_mime: ['image/png','image/jpeg','image/webp'],
    allowed_ext: ['png','jpg','jpeg','webp'],
    svg_enabled: false
  };
}

// ctx.settings expected to include media policy keys when wired to settings_scoped
function resolvePolicy(ctx){
  const p = defaultPolicy();
  const s = ctx.settings || {};
  if(typeof s.media_max_file_size_mb === 'number') p.max_file_size_mb = s.media_max_file_size_mb;
  if(typeof s.media_max_files_per_request === 'number') p.max_files_per_request = s.media_max_files_per_request;
  if(Array.isArray(s.media_allowed_mime)) p.allowed_mime = s.media_allowed_mime;
  if(Array.isArray(s.media_allowed_ext)) p.allowed_ext = s.media_allowed_ext;
  if(typeof s.media_svg_enabled === 'boolean') p.svg_enabled = s.media_svg_enabled;
  if(p.svg_enabled){
    if(!p.allowed_mime.includes('image/svg+xml')) p.allowed_mime.push('image/svg+xml');
    if(!p.allowed_ext.includes('svg')) p.allowed_ext.push('svg');
  }
  return p;
}

async function storeMetadata(ctx, meta){
  // optional table hook (if exists); safe best-effort
  try{
    await ctx.db.run(
      `CREATE TABLE IF NOT EXISTS public_media_assets (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        org_id BIGINT NOT NULL,
        website_id BIGINT NULL,
        sha256 VARCHAR(64) NOT NULL,
        mime VARCHAR(80) NOT NULL,
        ext VARCHAR(10) NOT NULL,
        size_bytes BIGINT NOT NULL,
        filename VARCHAR(255) NULL,
        created_by BIGINT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_media_org (org_id, created_at),
        UNIQUE KEY uq_media_sha (org_id, sha256)
      )`
    );
    await ctx.db.run(
      `INSERT IGNORE INTO public_media_assets (org_id, website_id, sha256, mime, ext, size_bytes, filename, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [ctx.org_id, ctx.website_id||null, meta.sha256, meta.mime, meta.ext, meta.size_bytes, meta.filename||null, ctx.actor_id||null]
    );
  }catch(e){}
}

module.exports = { sha256, isAllowed, resolvePolicy, storeMetadata };
