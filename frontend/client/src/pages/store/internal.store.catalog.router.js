// Store Catalog Internal Router (P3.4)
const express = require('express');
const router = express.Router();
const { z } = require('zod');

const requireModule = require('../../kernel/subscription/require_module');
const requireCapability = require('../../kernel/subscription/require_capability');
const { validateBody } = require('../../kernel/validation/validate');

const repo = require('./repos/store_catalog.repo');

router.use(requireModule('store'));

const Upsert = z.object({
  website_id: z.number().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().optional(),
  is_active: z.number().optional(),
  meta: z.record(z.any()).optional()
}).passthrough();

router.post('/store/catalog/upsert', requireCapability('store.catalog'), validateBody(Upsert), async (req, res) => {
  const ctx = req.ctx || {};
  const b = req.body || {};
  const out = await repo.upsert({
    org_id: ctx.org_id,
    website_id: (b.website_id === undefined ? null : b.website_id),
    sku: b.sku,
    name: b.name,
    description: b.description,
    price: b.price,
    currency: b.currency || 'SAR',
    is_active: (b.is_active === undefined ? 1 : b.is_active),
    meta: b.meta || {}
  });
  res.json({ status:'ok', ...out });
});

router.get('/store/catalog/list', requireCapability('store.catalog'), async (req, res) => {
  const ctx = req.ctx || {};
  const website_id = req.query.website_id !== undefined ? Number(req.query.website_id) : null;
  const only_active = String(req.query.only_active||'0') === '1';
  const rows = await repo.list({ org_id: ctx.org_id, website_id, only_active, limit: 200, offset: 0 });
  res.json({ items: rows });
});

module.exports = router;
