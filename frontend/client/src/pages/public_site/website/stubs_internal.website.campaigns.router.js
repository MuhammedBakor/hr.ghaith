const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { audit } = require('../../../kernel/audit.NOTE');
const { safeText } = require('../../../kernel/sanitize.NOTE');

function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }

const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

function codeify(s){ return String(s||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').slice(0,64); }

router.get('/websites/:website_id/campaigns',
  requireAuth, requireOrgScope, requirePerm('marketing:campaigns:read'),
  async (req,res)=>{
    const rows = await req.ctx.db.selectMany(
      `SELECT id, code, name, channel, landing_slug, status, utm_json, settings_json, updated_at
       FROM public_campaigns WHERE website_id=? ORDER BY updated_at DESC LIMIT 200`,
      [req.params.website_id]
    );
    res.json({ ok:true, rows: rows.map(r=>({ ...r, utm_json: JSON.parse(r.utm_json||'{}'), settings_json: JSON.parse(r.settings_json||'{}') })) });
  }
);

router.post('/websites/:website_id/campaigns', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('marketing:campaigns:create'),
  express.json({ limit:'160kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const id=uuid();
    const name=safeText(req.body?.name||'Campaign',190);
    const code=safeText(req.body?.code||codeify(name),64);

    await req.ctx.db.run(
      `INSERT INTO public_campaigns
       (id, org_id, website_id, code, name, utm_json, landing_slug, channel, status, settings_json, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, req.ctx.org_id, req.params.website_id, code, name, JSON.stringify(req.body?.utm_json||{}), req.body?.landing_slug||null, req.body?.channel||null, String(req.body?.status||'ACTIVE').toUpperCase(), JSON.stringify(req.body?.settings_json||{}), req.ctx.actor_id]
    );

    await audit(req.ctx,{ action:'marketing.campaign.create', entity_type:'public_campaign', entity_id:id, reason, meta:{ website_id:req.params.website_id, code } });
    res.json({ ok:true, id, code });
  }
);

router.patch('/campaigns/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('marketing:campaigns:update'),
  express.json({ limit:'160kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const patch={};
    for(const k of ['name','code','utm_json','landing_slug','channel','status','settings_json']){
      if(req.body?.[k] !== undefined) patch[k]=req.body[k];
    }

    const sets=[]; const vals=[];
    for(const [k,v] of Object.entries(patch)){
      if(k==='utm_json' || k==='settings_json'){ sets.push(`${k}=?`); vals.push(JSON.stringify(v||{})); }
      else if(k==='name'){ sets.push(`${k}=?`); vals.push(safeText(v||'',190)); }
      else if(k==='code'){ sets.push(`${k}=?`); vals.push(safeText(v||'',64)); }
      else if(k==='status'){ sets.push(`${k}=?`); vals.push(String(v||'ACTIVE').toUpperCase()); }
      else { sets.push(`${k}=?`); vals.push(v); }
    }
    sets.push(`updated_at=NOW()`);

    vals.push(req.ctx.org_id, req.params.id);
    await req.ctx.db.run(`UPDATE public_campaigns SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);

    await audit(req.ctx,{ action:'marketing.campaign.update', entity_type:'public_campaign', entity_id:req.params.id, reason, meta:{ patch:Object.keys(patch) } });
    res.json({ ok:true });
  }
);

module.exports = router;