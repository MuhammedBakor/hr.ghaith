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

const { publishLanding } = require('../services/landing_publish.service');

function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function nowSql(){ return new Date().toISOString().slice(0,19).replace('T',' '); }
function slugify(s){
  return String(s||'').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,180);
}

router.get('/websites/:website_id/landings',
  requireAuth, requireOrgScope, requirePerm('public_site:landings:read'),
  async (req,res)=>{
    const rows = await req.ctx.db.selectMany(
      `SELECT id, campaign_id, slug, title, status, updated_at
       FROM public_landing_pages WHERE website_id=? ORDER BY updated_at DESC LIMIT 200`,
      [req.params.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.post('/websites/:website_id/landings', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:landings:create'),
  express.json({ limit:'700kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const id = uuid();
    const now = nowSql();
    const title = safeText(req.body?.title || 'Landing', 190);
    const slug = safeText(req.body?.slug || slugify(title), 190);

    await req.ctx.db.run(
      `INSERT INTO public_landing_pages
       (id, org_id, website_id, campaign_id, slug, title, blocks_json, seo_json, status, created_by, updated_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, req.ctx.org_id, req.params.website_id, req.body?.campaign_id||null,
        slug, title,
        JSON.stringify(req.body?.blocks_json||[]),
        JSON.stringify(req.body?.seo_json||{}),
        'DRAFT', req.ctx.actor_id, req.ctx.actor_id, now, now
      ]
    );

    await audit(req.ctx,{ action:'public_site.landing.create', entity_type:'public_landing_page', entity_id:id, reason, meta:{ website_id:req.params.website_id, slug } });
    res.json({ ok:true, id, slug });
  }
);

router.patch('/landings/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:landings:update'),
  express.json({ limit:'700kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const patch={};
    for(const k of ['campaign_id','slug','title','blocks_json','seo_json','status']){
      if(req.body?.[k] !== undefined) patch[k]=req.body[k];
    }

    const sets=[]; const vals=[];
    for(const [k,v] of Object.entries(patch)){
      if(k==='blocks_json'){ sets.push(`${k}=?`); vals.push(JSON.stringify(v||[])); }
      else if(k==='seo_json'){ sets.push(`${k}=?`); vals.push(JSON.stringify(v||{})); }
      else if(k==='title' || k==='slug'){ sets.push(`${k}=?`); vals.push(safeText(v||'',190)); }
      else if(k==='status'){ sets.push(`${k}=?`); vals.push(String(v||'DRAFT').toUpperCase()); }
      else { sets.push(`${k}=?`); vals.push(v); }
    }
    sets.push(`updated_by=?`); vals.push(req.ctx.actor_id);
    sets.push(`updated_at=NOW()`);

    vals.push(req.ctx.org_id, req.params.id);
    await req.ctx.db.run(`UPDATE public_landing_pages SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);

    await audit(req.ctx,{ action:'public_site.landing.update', entity_type:'public_landing_page', entity_id:req.params.id, reason, meta:{ patch:Object.keys(patch) } });
    res.json({ ok:true });
  }
);

router.post('/landings/:id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:landings:publish'),
  express.json({ limit:'50kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });
    const out = await publishLanding(req.ctx, { landing_id:req.params.id, reason });
    await audit(req.ctx,{ action:'public_site.landing.publish', entity_type:'public_landing_page', entity_id:req.params.id, reason, meta:{ snapshot_id:out.snapshot_id, doc_no:out.doc_no } });
    res.json(out);
  }
);

module.exports = router;