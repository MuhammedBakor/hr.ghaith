// Store Checkout (P3.0) - creates Finance Intent (service) from public or internal order request
const express = require('express');
const router = express.Router();
const { z } = require('zod');

const requireModule = require('../../kernel/subscription/require_module');
const requireCapability = require('../../kernel/subscription/require_capability');
const { validateBody } = require('../../kernel/validation/validate');

const financeIntents = require('../finance/repos/finance_intents.repo');
const dms = require('../dms/services/files.service');
const { render } = require('../../kernel/templates/simple_template');
const { attachCoreArtifact } = require('../../kernel/artifacts/core_artifacts.service');

router.use(requireModule('store'));

const CreateOrderSchema = z.object({
  reason: z.string().min(3),
  order_no: z.string().min(1).optional(),
  customer_name: z.string().min(1).optional(),
  amount_total: z.number().min(0),
  currency: z.string().optional(),
  items: z.array(z.object({
    sku: z.string().min(1),
    name: z.string().min(1).optional(),
    qty: z.number().min(1),
    price: z.number().min(0)
  })).optional()
}).passthrough();

router.post('/store/orders/checkout',
  requireCapability('store.core'),
  validateBody(CreateOrderSchema),
  async (req, res) => {
    const ctx = req.ctx || {};
    const body = req.body || {};
    const order_no = body.order_no || ('ORD-' + Math.random().toString(36).slice(2,8).toUpperCase());

    const intent = await financeIntents.create({
      org_id: ctx.org_id,
      branch_id: ctx.branch_id,
      kind: 'store_order',
      source_kind: 'store_order',
      source_id: order_no,
      amount_total: body.amount_total,
      currency: body.currency || 'SAR',
      customer_name: body.customer_name || null,
      reason: body.reason,
      meta: { items: body.items || [] }
    });

    // NOTE order summary (store scope) in DMS
    const html = render(`
<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
  <h2>طلب شراء (Checkout)</h2>
  <p><b>رقم الطلب:</b> {{order_no}}</p>
  <p><b>اسم العميل:</b> {{customer_name}}</p>
  <p><b>المبلغ:</b> {{amount_total}} {{currency}}</p>
  <p><b>Finance Intent:</b> {{intent_id}}</p>
  <p><b>السبب:</b> {{reason}}</p>
  <hr/>
  <pre style="background:#f6f6f6;padding:10px;border:1px solid #eee">{{items_json}}</pre>
</div>`, {
      order_no,
      customer_name: body.customer_name || '-',
      amount_total: body.amount_total,
      currency: body.currency || 'SAR',
      intent_id: intent.id,
      reason: body.reason,
      items_json: JSON.stringify(body.items || [], null, 2)
    });

    let file = null;
    try {
      file = await dms.createFileFromContent(ctx, {
        folder_key: 'store_orders',
        folder_path: `STORE/Orders/${order_no}`,
        filename: `order_${order_no}.html`,
        content: html,
        content_type: 'text/html',
        meta: { order_no, finance_intent_id: intent.id, kind:'store_order' }
      });
    } catch(e) {}

    try {
      if (file && file.id) {
        await attachCoreArtifact(ctx, {
          entity_type: 'store_order',
          entity_id: order_no,
          artifact_type: 'report',
          source_module: 'dms',
          source_ref_id: file.id,
          dms_file_id: file.id,
          title: `طلب شراء (${order_no})`,
          meta: { finance_intent_id: intent.id }
        });
      }
    } catch(e) {}

    res.json({ status:'checkout_created', order_no, finance_intent_id: intent.id, dms_file_id: file ? file.id : null });
  }
);

module.exports = router;
