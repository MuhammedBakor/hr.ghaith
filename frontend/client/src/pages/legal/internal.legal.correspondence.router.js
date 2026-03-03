// Legal correspondence router (P4.3)
const express = require('express');
const router = express.Router();

const requireModule = require('../../kernel/subscription/require_module');
const requireCapability = require('../../kernel/subscription/require_capability');
const { z } = require('zod');
const { validateBody, validateParams } = require('../../kernel/validation/validate');

const dms = require('../dms/services/files.service');
const { attachCoreArtifact } = require('../../kernel/artifacts/core_artifacts.service');
const { nextDocNoAsync } = require('../../kernel/comms/doc_numbers.service');
const { publishPublicArtifact } = require('../../kernel/artifacts/public_artifacts.service');

const corrRepo = require('./storage/correspondence.repo');
const { renderCorrespondenceHtml, renderFromTemplate } = require('./templates/correspondence_renderer.service');

router.use(requireModule('legal'));

const CreateBody = z.object({
  reason: z.string().min(3),
  case_id: z.string().optional(),
  recipient_type: z.enum(['client','court','agency','vendor','other']),
  recipient_name: z.string().min(2),
  recipient_ref: z.string().optional(),
  channel: z.enum(['print','email','whatsapp','portal','other']).optional(),
  subject: z.string().min(2),
  body_html: z.string().optional(),
  template_code: z.string().optional(),
  template_version: z.number().int().positive().optional(),
  template_data: z.any().optional(),
  template_html: z.string().optional(),
  publish_public: z.boolean().optional(),
  public_ttl_days: z.number().int().positive().optional()
}).passthrough();

const ListParams = z.object({ id: z.string().min(1) });

router.post('/legal/correspondence/create', requireCapability('legal.core'), validateBody(CreateBody), async (req,res)=>{
  const ctx=req.ctx||{};
  const b=req.body||{};

  const doc_no = await nextDocNoAsync({ org_id: ctx.org_id, branch_id: ctx.branch_id||null, kind:'legal_correspondence', prefix:'LC' });

  let body_html = b.body_html || '';
  try{
    if (!body_html && b.template_html) {
      body_html = renderFromTemplate({ template_html: b.template_html, data: b.template_data||{} });
    }
  }catch(e){}

  const html = await renderCorrespondenceHtml({
    doc_no,
    subject: b.subject,
    body_html,
    recipient_type: b.recipient_type,
    recipient_name: b.recipient_name,
    channel: b.channel || 'print',
    public_url: ''
  });

  const file = await dms.createFileFromContent(ctx, {
    folder_key:'legal_correspondence',
    folder_path:`LEGAL/Correspondence/${doc_no}`,
    filename:`correspondence_${doc_no}.html`,
    content: html,
    content_type:'text/html',
    meta:{ doc_no, case_id: b.case_id||null, recipient_type: b.recipient_type, recipient_name: b.recipient_name, channel: b.channel||'print' }
  });

  let public_ref=null, public_url=null;
  try{
    if (b.publish_public && file && file.id) {
      const out = await publishPublicArtifact(ctx, { dms_file_id: file.id, branch_id: ctx.branch_id||null, kind:'legal_correspondence', title:`Legal Correspondence ${doc_no}`, prefix:'C', ttl_days: b.public_ttl_days||null });
      public_ref = out.public_ref;
      public_url = `/public/artifact/${public_ref}`;
    }
  }catch(e){}

  await corrRepo.create({
    org_id: ctx.org_id,
    branch_id: ctx.branch_id||null,
    case_id: b.case_id||null,
    doc_no,
    recipient_type: b.recipient_type,
    recipient_name: b.recipient_name,
    recipient_ref: b.recipient_ref||null,
    channel: b.channel||'print',
    subject: b.subject,
    public_ref,
    dms_file_id: file && file.id ? file.id : null,
    meta: { reason: b.reason }
  });

  if (b.case_id) {
    await attachCoreArtifact(ctx, { entity_type:'legal_case', entity_id: b.case_id, artifact_type:'legal_correspondence', title:`${doc_no} - ${b.subject}`, dms_file_id: file && file.id ? file.id : null, meta:{ doc_no, recipient_type: b.recipient_type, recipient_name: b.recipient_name, channel: b.channel||'print', public_ref } });
  }

  res.json({ ok:true, doc_no, dms_file_id: file && file.id ? file.id : null, public_ref, public_url });
});

router.get('/legal/cases/:id/correspondence', requireCapability('legal.core'), validateParams(ListParams), async (req,res)=>{
  const ctx=req.ctx||{};
  const limit = Number(req.query.limit||200);
  const offset = Number(req.query.offset||0);
  const items = await corrRepo.listByCase({ org_id: ctx.org_id, case_id: req.params.id, limit, offset });
  res.json({ case_id: req.params.id, items });
});

module.exports = router;
