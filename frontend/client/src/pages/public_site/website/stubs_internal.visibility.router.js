const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');

const express = require('express');
const router = express.Router();

const { requireAuth, requireOrgScope, requirePerm } = require('../core/stubs/internalGuards');
const { audit } = require('../../../kernel/audit.NOTE');
const { getRule, upsertRule } = require('../services/visibility.service');


const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

router.get('/visibility/:entity_type/:entity_id',
  requireAuth, requireOrgScope, requirePerm('public_site:visibility:read'),
  async (req,res)=>{
    const v = await getRule(req.ctx, req.params.entity_type, req.params.entity_id);
    res.json({ ok:true, visibility:v });
  }
);

router.put('/visibility/:entity_type/:entity_id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:visibility:update'),
  express.json({ limit:'80kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const out = await upsertRule(req.ctx, req.params.entity_type, req.params.entity_id, req.body.website_id||null, req.body.branch_id||null, req.body.visibility_json||{});
    await audit(req.ctx,{ action:'public.visibility.upsert', entity_type:'public_visibility_rule', entity_id:out.id, reason, meta:{ entity_type:req.params.entity_type, entity_id:req.params.entity_id } });
    res.json(out);
  }
);

module.exports = router;