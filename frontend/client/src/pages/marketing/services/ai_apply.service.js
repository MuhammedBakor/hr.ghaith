
async function applyToHomepage(ctx, { website_id, homepage_json, reason }){
  if(!reason) throw new Error('REASON_REQUIRED');
  await ctx.db.run(
    `UPDATE public_websites
     SET settings_json=JSON_SET(COALESCE(settings_json,'{}'),'$.homepage', CAST(? AS JSON)),
         updated_by=?, updated_at=NOW()
     WHERE org_id=? AND id=?`,
    [JSON.stringify(homepage_json||{}), ctx.actor_id||null, ctx.org_id, website_id]
  );
  return { ok:true };
}

async function applyToBlogDraft(ctx, { post_id, patch, reason }){
  if(!reason) throw new Error('REASON_REQUIRED');
  const sets=[]; const vals=[];
  for(const [k,v] of Object.entries(patch||{})){
    if(['title','excerpt','content_md','cover_asset_id'].includes(k)){
      sets.push(`${k}=?`); vals.push(v);
    }
  }
  if(!sets.length) return { ok:true, skipped:true };
  vals.push(ctx.actor_id||null, ctx.org_id, post_id);
  await ctx.db.run(`UPDATE public_blog_posts SET ${sets.join(', ')}, updated_by=?, updated_at=NOW() WHERE org_id=? AND id=?`, vals);
  return { ok:true };
}

async function applyToLanding(ctx, { landing_id, blocks_json, reason }){
  if(!reason) throw new Error('REASON_REQUIRED');
  await ctx.db.run(
    `UPDATE public_landing_pages
     SET blocks_json=?, updated_by=?, updated_at=NOW()
     WHERE website_id=? AND id=?`,
    [JSON.stringify(blocks_json||[]), ctx.actor_id||null, ctx.website_id, landing_id]
  );
  return { ok:true };
}

module.exports = { applyToHomepage, applyToBlogDraft, applyToLanding };
