const { getDefaultKit } = require('./brand_kits.service');

function kitToTheme(kit){
  return {
    primary: kit.primary,
    secondary: kit.secondary,
    font_family: kit.font_family
  };
}

async function applyBrandToEntity(ctx, { entity_type, entity_id, branch_id=null }){
  const kit = await getDefaultKit(ctx, branch_id);
  const theme = kitToTheme(kit);

  const map = {
    page: { table:'public_pages', col:'content_json' },
    landing: { table:'public_landing_pages', col:'blocks_json' },
    blog_post: { table:'public_blog_posts', col:'content_json' },
    profile: { table:'public_branch_profiles', col:'profile_json' },
    terms: { table:'public_pages', col:'content_json' },
  };
  const cfg = map[entity_type];
  if(!cfg) return { ok:false, error:'BAD_ENTITY' };

  const row = await ctx.db.selectOne(
    `SELECT ${cfg.col} AS doc FROM ${cfg.table} WHERE org_id=? AND id=? LIMIT 1`,
    [ctx.org_id, entity_id]
  );
  if(!row) return { ok:false, error:'NOT_FOUND' };

  const doc = row.doc ? JSON.parse(row.doc) : {};
  doc.theme = { ...(doc.theme||{}), ...theme, brand_kit_applied:true, brand_branch_id: branch_id };
  await ctx.db.run(
    `UPDATE ${cfg.table} SET ${cfg.col}=?, updated_at=NOW() WHERE org_id=? AND id=?`,
    [JSON.stringify(doc), ctx.org_id, entity_id]
  );

  return { ok:true, kit, theme };
}

module.exports = { applyBrandToEntity, kitToTheme };
