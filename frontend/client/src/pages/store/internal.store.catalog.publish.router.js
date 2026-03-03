// Store Catalog Publish Router (P3.5)
const express = require('express');
const router = express.Router();
const { z } = require('zod');

const requireModule = require('../../kernel/subscription/require_module');
const requireCapability = require('../../kernel/subscription/require_capability');
const { validateBody } = require('../../kernel/validation/validate');

const catalog = require('./repos/store_catalog.repo');
const snaps = require('./repos/store_catalog_snapshots.repo');

const dms = require('../dms/services/files.service');
const { render } = require('../../kernel/templates/simple_template');
const { nextDocNoAsync } = require('../../kernel/comms/doc_numbers.service');

router.use(requireModule('store'));

const Publish = z.object({
  reason: z.string().min(3),
  website_id: z.number().optional()
}).passthrough();

router.post('/store/catalog/publish',
  requireCapability('store.catalog'),
  validateBody(Publish),
  async (req,res)=>{
    const ctx = req.ctx || {};
    const website_id = (req.body.website_id === undefined ? null : req.body.website_id);

    // Draft content from DB catalog (active only)
    const items = await catalog.list({ org_id: ctx.org_id, website_id, only_active: true, limit: 500, offset: 0 });
    const content_json = { version: 1, website_id, published_at: new Date().toISOString(), items: (items||[]).map(r=>({
      sku: r.sku, name: r.name, description: r.description, price: Number(r.price||0), currency: r.currency || 'SAR'
    })) };

    // doc_no + DMS artifact
    let doc_no = null;
    let dms_file_id = null;
    try{
      doc_no = await nextDocNoAsync({ org_id: ctx.org_id, branch_id: ctx.branch_id, kind:'store_catalog', prefix:'CAT' });
      const html = render(`
<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
  <h2>نشر كتالوج المتجر</h2>
  <p><b>رقم المستند:</b> {{doc_no}}</p>
  <p><b>Website:</b> {{website_id}}</p>
  <p><b>عدد العناصر:</b> {{count}}</p>
  <p><b>السبب:</b> {{reason}}</p>
  <hr/>
  <pre style="background:#f6f6f6;padding:10px;border:1px solid #eee">{{json}}</pre>
</div>`, {
        doc_no: doc_no || '-',
        website_id: website_id === null ? '-' : String(website_id),
        count: (content_json.items||[]).length,
        reason: req.body.reason,
        json: JSON.stringify(content_json, null, 2)
      });

      const f = await dms.createFileFromContent(ctx, {
        folder_key: 'store_catalog_publishes',
        folder_path: `STORE/Catalog/Publish/${website_id === null ? 'all' : website_id}/${doc_no}`,
        filename: `catalog_publish_${doc_no}.html`,
        content: html,
        content_type: 'text/html',
        meta: { doc_no, website_id, kind:'store_catalog_publish' }
      });
      dms_file_id = f && f.id ? f.id : null;
    }catch(e){}

    const snap = await snaps.createSnapshot({
      org_id: ctx.org_id,
      website_id,
      content_json,
      reason: req.body.reason,
      created_by: (ctx.user_id || null),
      doc_no,
      meta: { dms_file_id }
    });

    res.json({ status:'published', snapshot_id: snap.id, doc_no, dms_file_id, website_id, items_count: (content_json.items||[]).length });
  }
);

router.get('/store/catalog/snapshots',
  requireCapability('store.catalog'),
  async (req,res)=>{
    const ctx=req.ctx||{};
    const website_id = req.query.website_id !== undefined ? Number(req.query.website_id) : null;
    const rows = await snaps.listSnapshots({ org_id: ctx.org_id, website_id, limit: 50 });
    res.json({ snapshots: rows });
  }
);

module.exports = router;
