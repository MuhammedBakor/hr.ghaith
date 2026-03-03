
async function getBrandForWebsite(ctx, website_id){
  const row = await ctx.db.selectOne(
    `SELECT brand_json, tone_json FROM public_brand_settings WHERE website_id=? LIMIT 1`,
    [website_id]
  );
  return {
    brand: row ? JSON.parse(row.brand_json || '{}') : {},
    tone: row ? JSON.parse(row.tone_json || '{}') : {}
  };
}
module.exports = { getBrandForWebsite };
