
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

async function createCampaign(ctx, body){
  const id = uuid();
  const now = nowSql();
  await ctx.db.run(
    `INSERT INTO marketing_campaigns
     (id, org_id, branch_id, website_id, code, name, objective, status, utm_json, schedule_json, settings_json, created_by, updated_by, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, ctx.org_id, ctx.branch_id||null, body.website_id||null,
      String(body.code||'').trim(), String(body.name||'').trim(),
      body.objective||null,
      String(body.status||'DRAFT').toUpperCase(),
      JSON.stringify(body.utm_json||{}),
      JSON.stringify(body.schedule_json||{}),
      JSON.stringify(body.settings_json||{}),
      ctx.actor_id||null, ctx.actor_id||null,
      now, now
    ]
  );
  return { ok:true, id };
}

async function updateCampaign(ctx, id, patch){
  const sets=[]; const vals=[];
  for(const k of ['website_id','code','name','objective','status','utm_json','schedule_json','settings_json']){
    if(patch[k] === undefined) continue;
    if(['utm_json','schedule_json','settings_json'].includes(k)){
      sets.push(`${k}=?`); vals.push(JSON.stringify(patch[k]||{}));
    } else {
      sets.push(`${k}=?`); vals.push(patch[k]);
    }
  }
  sets.push('updated_by=?'); vals.push(ctx.actor_id||null);
  sets.push('updated_at=NOW()');
  vals.push(ctx.org_id, id);
  await ctx.db.run(`UPDATE marketing_campaigns SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);
  return { ok:true };
}

module.exports = { createCampaign, updateCampaign };
