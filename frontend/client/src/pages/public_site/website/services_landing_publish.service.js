
const { createSnapshot } = require('../../print_standard/services/snapshot.service');

async function publishLanding(ctx, { landing_id, reason }){
  if(!reason) throw new Error('REASON_REQUIRED');

  const row = await ctx.db.selectOne(
    `SELECT id, website_id, campaign_id, slug, title, blocks_json, seo_json, status
     FROM public_landing_pages WHERE website_id=? AND id=? LIMIT 1`,
    [ctx.website_id, landing_id]
  );
  if(!row) throw new Error('NOT_FOUND');

  const snap = await createSnapshot(ctx, {
    content_type: 'public_landing_page',
    content_id: row.id,
    version: 'published',
    snapshot_json: {
      id: row.id,
      website_id: row.website_id,
      campaign_id: row.campaign_id,
      slug: row.slug,
      title: row.title,
      blocks: JSON.parse(row.blocks_json || '[]'),
      seo_json: JSON.parse(row.seo_json || '{}')
    },
    prefix: 'LAND'
  });

  await ctx.db.run(
    `UPDATE public_landing_pages
     SET status='PUBLISHED', published_snapshot_id=?, updated_by=?, updated_at=NOW()
     WHERE id=? AND website_id=?`,
    [snap.id, ctx.actor_id || null, row.id, ctx.website_id]
  );

  return { ok:true, snapshot_id: snap.id, doc_no: snap.doc_no };
}

module.exports = { publishLanding };
