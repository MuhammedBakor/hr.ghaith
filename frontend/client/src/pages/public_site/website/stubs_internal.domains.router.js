const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');

const express = require('express');
const router = express.Router();

const { requireAuth, requireOrgScope, requirePerm } = require('../core/stubs/internalGuards');
const { audit } = require('../../../kernel/audit.NOTE');
const { addDomain, listDomains, removeDomain } = require('../services/domains.service');


const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

router.get('/websites/:website_id/domains',
  requireAuth, requireOrgScope, requirePerm('public_site:domains:read'),
  async (req,res)=>{
    const out = await listDomains(req.ctx, req.params.website_id);
    res.json(out);
  }
);

router.post('/websites/:website_id/domains', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:domains:create'),
  express.json({ limit:'40kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const out = await addDomain(req.ctx, req.params.website_id, req.body.domain, !!req.body.is_primary);
    await audit(req.ctx,{ action:'public.domains.add', entity_type:'public_website_domain', entity_id:out.id, reason, meta:{ domain: out.domain } });
    res.json(out);
  }
);

router.delete('/websites/domains/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:domains:delete'),
  express.json({ limit:'20kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    await removeDomain(req.ctx, req.params.id);
    await audit(req.ctx,{ action:'public.domains.remove', entity_type:'public_website_domain', entity_id:req.params.id, reason });
    res.json({ ok:true });
  }
);

module.exports = router;