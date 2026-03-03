function defaultBrandKit(){
  return {
    name: 'Default',
    primary: '#1D4ED8',
    secondary: '#0B1220',
    font_family: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
    logo_url: '',
    tone: 'professional'
  };
}

async function ensureTable(ctx){
  await ctx.db.run(`CREATE TABLE IF NOT EXISTS public_brand_kits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    branch_id BIGINT NULL,
    name VARCHAR(80) NOT NULL,
    kit_json JSON NOT NULL,
    is_default TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_brand_default (org_id, branch_id, is_default)
  )`);
}

async function upsertDefaultKit(ctx, { branch_id=null, kit }){
  await ensureTable(ctx);
  const k = kit || defaultBrandKit();
  await ctx.db.run(
    `UPDATE public_brand_kits SET is_default=0
     WHERE org_id=? AND ((branch_id IS NULL AND ? IS NULL) OR branch_id=?)`,
    [ctx.org_id, branch_id, branch_id]
  );
  const row = await ctx.db.selectOne(
    `SELECT id FROM public_brand_kits
     WHERE org_id=? AND ((branch_id IS NULL AND ? IS NULL) OR branch_id=?)
       AND name=? LIMIT 1`,
    [ctx.org_id, branch_id, branch_id, k.name]
  );
  if(row){
    await ctx.db.run(`UPDATE public_brand_kits SET kit_json=?, is_default=1, updated_at=NOW() WHERE id=?`, [JSON.stringify(k), row.id]);
    return { ok:true, id: row.id };
  }
  const r = await ctx.db.run(
    `INSERT INTO public_brand_kits (org_id, branch_id, name, kit_json, is_default) VALUES (?,?,?,?,1)`,
    [ctx.org_id, branch_id, k.name, JSON.stringify(k)]
  );
  return { ok:true, id: (r && (r.insertId || r.lastID)) || null };
}

async function getDefaultKit(ctx, branch_id=null){
  await ensureTable(ctx);
  const row = await ctx.db.selectOne(
    `SELECT kit_json FROM public_brand_kits WHERE org_id=? AND branch_id=? AND is_default=1 LIMIT 1`,
    [ctx.org_id, branch_id]
  );
  if(row && row.kit_json) return JSON.parse(row.kit_json);
  const row2 = await ctx.db.selectOne(
    `SELECT kit_json FROM public_brand_kits WHERE org_id=? AND branch_id IS NULL AND is_default=1 LIMIT 1`,
    [ctx.org_id]
  );
  if(row2 && row2.kit_json) return JSON.parse(row2.kit_json);
  return defaultBrandKit();
}

module.exports = { defaultBrandKit, upsertDefaultKit, getDefaultKit };
