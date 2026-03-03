const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');

const express = require('express');
const router = express.Router();

const { requireAuth, requireOrgScope, requirePerm } = require('../core/stubs/internalGuards');
const { audit } = require('../../../kernel/audit.NOTE');
const { publishProfileSnapshot } = require('../services/profile_print.service');


const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

router.post('/websites/:website_id/profile/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:profile:publish'),
  express.json({ limit:'80kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const out = await publishProfileSnapshot(req.ctx, { website_id: req.params.website_id, reason });
    if(!out.ok) return res.status(400).json(out);

    await audit(req.ctx,{ action:'public_site.profile.publish', entity_type:'public_branch_profile', entity_id:req.params.website_id, reason, meta:{ doc_no: out.doc_no }});
    res.json(out);
  }
);

module.exports = router;