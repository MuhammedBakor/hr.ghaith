
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

function cleanDomain(d){
  if(!d) return '';
  d = String(d).trim().toLowerCase();
  d = d.replace(/^https?:\/\//,'').replace(/\/$/,'');
  return d;
}

async function addDomain(ctx, website_id, domain, is_primary){
  const id = uuid();
  const now = nowSql();
  domain = cleanDomain(domain);
  await ctx.db.run(
    `INSERT INTO public_website_domains
     (id, org_id, branch_id, website_id, domain, is_primary, status, created_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, ctx.org_id, ctx.branch_id||null, website_id, domain, is_primary?1:0, 'PENDING', ctx.actor_id||null, now, now]
  );
  return { ok:true, id, domain, status:'PENDING' };
}

async function listDomains(ctx, website_id){
  const rows = await ctx.db.selectMany(
    `SELECT id, domain, is_primary, status, notes, updated_at
     FROM public_website_domains WHERE org_id=? AND website_id=? ORDER BY is_primary DESC, updated_at DESC LIMIT 100`,
    [ctx.org_id, website_id]
  );
  return { ok:true, rows };
}

async function removeDomain(ctx, id){
  await ctx.db.run(`DELETE FROM public_website_domains WHERE org_id=? AND id=?`, [ctx.org_id, id]);
  return { ok:true };
}

module.exports = { cleanDomain, addDomain, listDomains, removeDomain };
