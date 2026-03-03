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


router.get('/websites/:website_id/achievements',
  requireAuth, requireOrgScope, requirePerm('public_site:achievements:read'),
  async (req,res)=>{
    const rows = await req.ctx.db.selectMany(
      `SELECT id, title, year, description, media_asset_id, sort_no, status, updated_at
       FROM public_branch_achievements WHERE website_id=? ORDER BY sort_no ASC, updated_at DESC LIMIT 500`,
      [req.params.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.post('/websites/:website_id/achievements', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:achievements:create'),
  express.json({ limit:'120kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });
    const id = uuid();
    await req.ctx.db.run(
      `INSERT INTO public_branch_achievements
       (id, org_id, website_id, title, year, description, media_asset_id, sort_no, status, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
      [id, req.ctx.org_id, req.params.website_id, safeText(req.body?.title||'Achievement',190), req.body?.year||null, safeText(req.body?.description||'',600)||null, req.body?.media_asset_id||null, req.body?.sort_no||100, String(req.body?.status||'ACTIVE').toUpperCase(), req.ctx.actor_id]
    );
    await audit(req.ctx, { action:'public_site.achievement.create', entity_type:'public_website', entity_id:req.params.website_id, reason, meta:{ id } });
    res.json({ ok:true, id });
  }
);

router.patch('/achievements/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:achievements:update'),
  express.json({ limit:'120kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const patch = {};
    for(const k of ['title','year','description','media_asset_id','sort_no','status']){
      if(req.body?.[k] !== undefined) patch[k]=req.body[k];
    }

    const sets=[]; const vals=[];
    for(const [k,v] of Object.entries(patch)){
      if(k==='title') vals.push(safeText(v||'',190));
      else if(k==='description') vals.push(safeText(v||'',600)||null);
      else if(k==='status') vals.push(String(v||'ACTIVE').toUpperCase());
      else vals.push(v);
      sets.push(`${k}=?`);
    }
    sets.push(`updated_at=NOW()`);

    vals.push(req.ctx.org_id, req.params.id);
    await req.ctx.db.run(`UPDATE public_branch_achievements SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);
    await audit(req.ctx, { action:'public_site.achievement.update', entity_type:'public_branch_achievement', entity_id:req.params.id, reason, meta:{ patch:Object.keys(patch) } });
    res.json({ ok:true });
  }
);

module.exports = router;