const { createSnapshot } = require('../../print_standard/services/snapshot.service');

async function publishPost(ctx, { post_id, reason }){
  if(!reason) throw new Error('REASON_REQUIRED');

  const row = await ctx.db.selectOne(
    `SELECT id, website_id, slug, title, excerpt, content_md, cover_asset_id, seo_json
     FROM public_blog_posts WHERE website_id=? AND id=? LIMIT 1`,
    [ctx.website_id, post_id]
  );
  if(!row) throw new Error('NOT_FOUND');

  const snap = await createSnapshot(ctx, {
    content_type: 'public_blog_post',
    content_id: row.id,
    version: 'published',
    snapshot_json: {
      id: row.id,
      website_id: row.website_id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content_md: row.content_md,
      cover_asset_id: row.cover_asset_id,
      seo_json: JSON.parse(row.seo_json || '{}')
    },
    prefix: 'BLOG'
  });

  await ctx.db.run(
    `UPDATE public_blog_posts
     SET status='PUBLISHED', published_at=NOW(), published_snapshot_id=?, updated_by=?, updated_at=NOW()
     WHERE id=? AND website_id=?`,
    [snap.id, ctx.actor_id || null, row.id, ctx.website_id]
  );

  return { ok:true, snapshot_id: snap.id, doc_no: snap.doc_no };
}

module.exports = { publishPost };
