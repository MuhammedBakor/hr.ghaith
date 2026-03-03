const express = require('express');
const router = express.Router();
const requireCapability = require('../../kernel/subscription/require_capability');
const { z } = require('zod');
const { validateBody, validateParams } = require('../../kernel/validation/validate');
const { render } = require('../../kernel/templates/simple_template');
const dms = require('../dms/services/files.service');

const CreateSchema = z.object({
  reason: z.string().min(3),
  customer_name: z.string().optional(),
  total_amount: z.number().optional(),
  currency: z.string().optional(),
}).passthrough();

const Params = z.object({ id: z.string().min(1) });

router.post('/store/orders/:id/generate-invoice', requireCapability('store.core'), validateParams(Params), validateBody(CreateSchema), async (req, res) => {
  const ctx = req.ctx || {};
  const order_id = req.params.id;
  const html = render(`
<div dir="rtl" style="font-family:Arial, sans-serif; line-height:1.6">
  <h2>فاتورة طلب متجر</h2>
  <p><b>رقم الطلب:</b> {{order_id}}</p>
  <p><b>العميل:</b> {{customer_name}}</p>
  <p><b>الإجمالي:</b> {{total_amount}} {{currency}}</p>
  <hr/>
  <p style="color:#666">فاتورة مبدئية — P2.0</p>
</div>`, {
    order_id,
    customer_name: req.body.customer_name || '',
    total_amount: req.body.total_amount || 0,
    currency: req.body.currency || 'SAR'
  });

  const out = await dms.createFileFromContent(ctx, {
    folder_key: 'store_invoices',
    folder_path: `STORE/Orders/${order_id}/Invoices`,
    filename: `${order_id}.html`,
    content: html,
    content_type: 'text/html',
    meta: { order_id, reason: req.body.reason, kind:'store_invoice' }
  });

  res.json({ status:'generated', order_id, dms_file_id: out.id });
});

module.exports = router;
