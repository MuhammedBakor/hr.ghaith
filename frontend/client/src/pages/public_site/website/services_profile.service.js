function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }
function id26(){
  const alphabet='0123456789abcdefghijklmnopqrstuvwxyz';
  let s=''; for(let i=0;i<26;i++) s+=alphabet[Math.floor(Math.random()*alphabet.length)];
  return s;
}

async function upsertProfile(ctx, { website_id, payload }){
  const now = nowSql();
  const ex = await ctx.db.selectOne(`SELECT id FROM public_branch_profiles WHERE website_id=? LIMIT 1`, [website_id]);
  if(ex){
    await ctx.db.run(
      `UPDATE public_branch_profiles
       SET title=?, tagline=?, about_md=?, contact_json=?, socials_json=?, achievements_json=?, gallery_json=?, seo_json=?, status=?, updated_by=?, updated_at=?
       WHERE website_id=?`,
      [
        payload.title || 'Profile',
        payload.tagline || null,
        payload.about_md || null,
        JSON.stringify(payload.contact_json || {}),
        JSON.stringify(payload.socials_json || {}),
        JSON.stringify(payload.achievements_json || []),
        JSON.stringify(payload.gallery_json || []),
        JSON.stringify(payload.seo_json || {}),
        String(payload.status || 'ACTIVE').toUpperCase(),
        ctx.actor_id || null,
        now,
        website_id
      ]
    );
    return { ok:true, updated:true };
  }

  const id = (payload.id && String(payload.id).length===26) ? String(payload.id) : id26();
  await ctx.db.run(
    `INSERT INTO public_branch_profiles
     (id, org_id, branch_id, website_id, title, tagline, about_md, contact_json, socials_json, achievements_json, gallery_json, seo_json, status, created_by, updated_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, ctx.org_id, ctx.branch_id || null, website_id,
      payload.title || 'Profile',
      payload.tagline || null,
      payload.about_md || null,
      JSON.stringify(payload.contact_json || {}),
      JSON.stringify(payload.socials_json || {}),
      JSON.stringify(payload.achievements_json || []),
      JSON.stringify(payload.gallery_json || []),
      JSON.stringify(payload.seo_json || {}),
      String(payload.status || 'ACTIVE').toUpperCase(),
      ctx.actor_id || null,
      ctx.actor_id || null,
      now, now
    ]
  );
  return { ok:true, created:true, id };
}

module.exports = { upsertProfile };
