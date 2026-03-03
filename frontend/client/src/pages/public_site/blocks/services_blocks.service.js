async function getPageBlocks(ctx, page_id){
  const row = await ctx.db.selectOne(`SELECT content_json FROM public_pages WHERE org_id=? AND id=? LIMIT 1`, [ctx.org_id, page_id]);
  if(!row) return { ok:false, error:'NOT_FOUND' };
  const content = JSON.parse(row.content_json||'{}');
  return { ok:true, blocks: content.blocks||[], content_json: content };
}

async function setPageBlocks(ctx, page_id, blocks){
  const row = await ctx.db.selectOne(`SELECT content_json FROM public_pages WHERE org_id=? AND id=? LIMIT 1`, [ctx.org_id, page_id]);
  if(!row) return { ok:false, error:'NOT_FOUND' };
  const content = JSON.parse(row.content_json||'{}');
  content.blocks = blocks || [];
  await ctx.db.run(`UPDATE public_pages SET content_json=?, updated_at=NOW() WHERE org_id=? AND id=?`, [JSON.stringify(content), ctx.org_id, page_id]);
  return { ok:true };
}

module.exports = { getPageBlocks, setPageBlocks };
