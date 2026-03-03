
const { createSnapshot } = require('../../print_standard/services/snapshot.service');
async function publishPage(ctx,{page_id,reason}){
  if(!reason) throw new Error('REASON_REQUIRED');
  const row = await ctx.db.selectOne(
    `SELECT * FROM public_pages WHERE id=? AND website_id=?`,
    [page_id, ctx.website_id]
  );
  if(!row) throw new Error('NOT_FOUND');
  const snap = await createSnapshot(ctx,{
    content_type:'public_page',
    content_id:row.id,
    version:'published',
    snapshot_json:row,
    prefix:'PAGE'
  });
  await ctx.db.run(
    `UPDATE public_pages SET status='PUBLISHED', published_snapshot_id=?, updated_at=NOW() WHERE id=?`,
    [snap.id, row.id]
  );
  return { ok:true, snapshot_id:snap.id, doc_no:snap.doc_no };
}
module.exports={ publishPage };
