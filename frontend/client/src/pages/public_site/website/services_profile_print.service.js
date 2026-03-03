
const { createSnapshot } = require('../../print_standard/services/snapshot.service');

async function publishProfileSnapshot(ctx, { website_id, reason }){
  // fetch profile
  const row = await ctx.db.selectOne(
    `SELECT id, title, tagline, about_md, contact_json, socials_json, achievements_json, gallery_json, seo_json, status
     FROM public_branch_profiles WHERE website_id=? LIMIT 1`,
    [website_id]
  );
  if(!row) return { ok:false, error:'PROFILE_NOT_FOUND' };

  const snapshot_json = {
    type:'branch_profile',
    website_id,
    profile: {
      title: row.title,
      tagline: row.tagline,
      about_md: row.about_md,
      contact: row.contact_json ? JSON.parse(row.contact_json) : {},
      socials: row.socials_json ? JSON.parse(row.socials_json) : {},
      achievements: row.achievements_json ? JSON.parse(row.achievements_json) : [],
      gallery: row.gallery_json ? JSON.parse(row.gallery_json) : []
    }
  };

  const snap = await createSnapshot(ctx,{
    content_type:'public.branch_profile',
    content_id: row.id,
    version: 'PUBLISHED',
    snapshot_json,
    prefix:'BRP'
  });

  await ctx.db.run(
    `UPDATE public_branch_profiles SET published_snapshot_id=?, published_doc_no=?, published_at=NOW(), updated_by=?, updated_at=NOW()
     WHERE website_id=?`,
    [snap.id, snap.doc_no, ctx.actor_id||null, website_id]
  );

  return { ok:true, snapshot_id: snap.id, doc_no: snap.doc_no };
}

module.exports = { publishProfileSnapshot };
