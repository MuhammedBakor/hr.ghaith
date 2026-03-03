const requireCapability = require('../../kernel/subscription/require_capability.js');
const { validateBody, validateParams } = require('../../kernel/validation/validate.js');
const { z } = require('zod');
// Store internal router (scaffold)
const express = require('express');
const router = express.Router();

// NOTE: use your kernel validators: validateBody/validateParams
// const { validateBody, validateParams } = require('../../kernel/validate');

const CheckoutBodySchema = z.object({ reason: z.string().min(3) }).passthrough();

const catalog = require('./services/store.catalog.service');

const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

const orders = require('./services/store.orders.service');

router.get('/store/catalog', async (req, res) => {
  // org/branch scope should come from req.ctx in Ghaith
  const org_id = req.ctx?.org_id || req.query.org_id;
  const branch_id = req.ctx?.branch_id || req.query.branch_id;
  const out = await catalog.listProducts(req.ctx || {}, { org_id, branch_id });
  res.json(out);
});

router.post('/store/orders', validateBody(ReasonSchema), async (req, res) => {
  // require reason (enforced by middleware in production)
  const out = await orders.createDraftOrder(req.ctx || {}, req.body || {});
  res.json(out);
});

router.post('/store/orders/:id/checkout', requireCapability('store.checkout'), validateParams(IdParamSchema), validateBody(ReasonSchema), async (req, res) => {
  const out = await orders.checkout(req.ctx || {}, { ...(req.body||{}), order_id: req.params.id });
  res.json(out);
});

module.exports = router;