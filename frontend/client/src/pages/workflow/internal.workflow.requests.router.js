// Workflow Requests Router (P3.6)
const express = require('express');
const router = express.Router();
const { z } = require('zod');

const requireModule = require('../../kernel/subscription/require_module');
const requireCapability = require('../../kernel/subscription/require_capability');
const { validateBody, validateParams } = require('../../kernel/validation/validate');

const svc = require('./services/requests.service');

router.use(requireModule('workflow'));

const Create = z.object({
  title: z.string().min(2),
  module_key: z.string().min(2),
  branch_id: z.number().optional(),
  assigned_role: z.string().optional(),
  assigned_user: z.string().optional(),
  payload: z.record(z.any()).optional(),
  reason: z.string().min(3)
}).passthrough();

router.post('/workflow/requests/create', requireCapability('workflow.requests'), validateBody(Create), async (req,res)=>{
  const ctx=req.ctx||{};
  const b=req.body||{};
  const out = await svc.createRequest(ctx, {
    org_id: ctx.org_id,
    branch_id: (b.branch_id===undefined? null : b.branch_id),
    title: b.title,
    payload: b.payload || {},
    reason: b.reason,
    module_key: b.module_key,
    assigned_role: b.assigned_role || null,
    assigned_user: b.assigned_user || null
  });
  res.json({ status:'ok', ...out });
});

router.get('/workflow/requests/list', requireCapability('workflow.requests'), async (req,res)=>{
  const ctx=req.ctx||{};
  const branch_id = req.query.branch_id !== undefined ? Number(req.query.branch_id) : null;
  const status = req.query.status ? String(req.query.status) : null;
  const rows = await svc.listRequests(ctx, { org_id: ctx.org_id, branch_id, status, limit: 100 });
  res.json({ items: rows });
});

const DecideParams = z.object({ id: z.string().min(1) });
const Decide = z.object({ decision: z.enum(['approved','rejected']), reason: z.string().min(3) }).passthrough();

router.post('/workflow/requests/:id/decide', requireCapability('workflow.requests'), validateParams(DecideParams), validateBody(Decide), async (req,res)=>{
  const ctx=req.ctx||{};
  const out = await svc.decideRequest(ctx, { org_id: ctx.org_id, id: req.params.id, decision: req.body.decision, reason: req.body.reason });
  res.json(out);
});

module.exports = router;
