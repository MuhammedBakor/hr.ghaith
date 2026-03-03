const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { requireAuth, requireOrgScope, requirePerm } = require('../../core/stubs/internalGuards');
const { audit } = require('../../../kernel/audit.NOTE');
const { safeText } = require('../../../kernel/sanitize.NOTE');

const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();


function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }

router.get('/websites/:website_id/offers',
  requireAuth, requireOrgScope, requirePerm('public_site:offers:read'),
  async (req,res)=>{
    const rows = await req.ctx.db.selectMany(
      `SELECT id, title, description, price_amount, currency, media_asset_id, stock_ref, status, updated_at
       FROM public_store_offers WHERE website_id=? ORDER BY updated_at DESC LIMIT 200`,
      [req.params.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.post('/websites/:website_id/offers', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:offers:create'),
  express.json({ limit:'180kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const id = uuid();
    const now = nowSql();

    await req.ctx.db.run(
      `INSERT INTO public_store_offers
       (id, org_id, website_id, title, description, price_amount, currency, media_asset_id, stock_ref, status, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.ctx.org_id, req.params.website_id,
        safeText(req.body?.title||'Offer',190),
        safeText(req.body?.description||'',600)||null,
        req.body?.price_amount||null,
        safeText(req.body?.currency||'SAR',10)||'SAR',
        req.body?.media_asset_id||null,
        safeText(req.body?.stock_ref||'',64)||null,
        String(req.body?.status||'ACTIVE').toUpperCase(),
        req.ctx.actor_id||null,
        now, now
      ]
    );

    await audit(req.ctx,{ action:'public_site.offer.create', entity_type:'public_store_offer', entity_id:id, reason, meta:{ website_id:req.params.website_id } });
    res.json({ ok:true, id });
  }
);

router.patch('/offers/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:offers:update'),
  express.json({ limit:'180kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const patch={};
    for(const k of ['title','description','price_amount','currency','media_asset_id','stock_ref','status']){
      if(req.body?.[k] !== undefined) patch[k]=req.body[k];
    }

    const sets=[]; const vals=[];
    for(const [k,v] of Object.entries(patch)){
      if(k==='title'){ sets.push(`${k}=?`); vals.push(safeText(v||'',190)); }
      else if(k==='description'){ sets.push(`${k}=?`); vals.push(safeText(v||'',600)||null); }
      else if(k==='currency'){ sets.push(`${k}=?`); vals.push(safeText(v||'SAR',10)); }
      else if(k==='stock_ref'){ sets.push(`${k}=?`); vals.push(safeText(v||'',64)||null); }
      else if(k==='status'){ sets.push(`${k}=?`); vals.push(String(v||'ACTIVE').toUpperCase()); }
      else { sets.push(`${k}=?`); vals.push(v); }
    }
    sets.push(`updated_at=NOW()`);

    vals.push(req.ctx.org_id, req.params.id);
    await req.ctx.db.run(`UPDATE public_store_offers SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);

    await audit(req.ctx,{ action:'public_site.offer.update', entity_type:'public_store_offer', entity_id:req.params.id, reason, meta:{ patch:Object.keys(patch) } });
    res.json({ ok:true });
  }
);

module.exports = router;