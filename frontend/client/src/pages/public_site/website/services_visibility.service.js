
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

function normalizeVisibility(v){
  const def = { anonymous:'public', staff:'public', admin:'public' };
  if(!v || typeof v !== 'object') return def;
  const out = {...def};
  for(const k of ['anonymous','staff','admin']){
    if(v[k] === 'hidden' || v[k] === 'public') out[k]=v[k];
  }
  return out;
}

function actorTier(ctx){
  // ctx.actor_id exists => staff at least
  if(!ctx || !ctx.actor_id) return 'anonymous';
  // if permissions bag exists and has marketing admin => admin (fallback staff)
  const perms = ctx.perms || [];
  if(perms.includes('marketing:admin') || perms.includes('public_site:admin')) return 'admin';
  return 'staff';
}

async function getRule(ctx, entity_type, entity_id){
  const row = await ctx.db.selectOne(
    `SELECT visibility_json FROM public_visibility_rules WHERE org_id=? AND entity_type=? AND entity_id=? LIMIT 1`,
    [ctx.org_id, entity_type, entity_id]
  );
  return normalizeVisibility(row ? JSON.parse(row.visibility_json||'{}') : null);
}

async function upsertRule(ctx, entity_type, entity_id, website_id, branch_id, visibility){
  const id = uuid();
  const now = nowSql();
  const v = normalizeVisibility(visibility);
  // upsert by unique key (org, entity_type, entity_id)
  const existing = await ctx.db.selectOne(
    `SELECT id FROM public_visibility_rules WHERE org_id=? AND entity_type=? AND entity_id=? LIMIT 1`,
    [ctx.org_id, entity_type, entity_id]
  );
  if(existing){
    await ctx.db.run(
      `UPDATE public_visibility_rules SET website_id=?, branch_id=?, visibility_json=?, updated_by=?, updated_at=? WHERE id=?`,
      [website_id||null, branch_id||null, JSON.stringify(v), ctx.actor_id||null, now, existing.id]
    );
    return { ok:true, id: existing.id, visibility:v };
  }
  await ctx.db.run(
    `INSERT INTO public_visibility_rules
     (id, org_id, branch_id, website_id, entity_type, entity_id, visibility_json, created_by, updated_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, ctx.org_id, branch_id||null, website_id||null, entity_type, entity_id, JSON.stringify(v), ctx.actor_id||null, ctx.actor_id||null, now, now]
  );
  return { ok:true, id, visibility:v };
}

async function enforce(ctx, entity_type, entity_id){
  const tier = actorTier(ctx);
  const v = await getRule(ctx, entity_type, entity_id);
  if(v[tier] === 'hidden') return { ok:false, allowed:false, reason:'VISIBILITY_HIDDEN' };
  return { ok:true, allowed:true, tier, visibility:v };
}

module.exports = { normalizeVisibility, actorTier, getRule, upsertRule, enforce };
