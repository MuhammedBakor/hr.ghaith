// HR Letters router (P2.8)
const express = require('express');
const router = express.Router();
const { z } = require('zod');

const requireCapability = require('../../kernel/subscription/require_capability');
const requireModule = require('../../kernel/subscription/require_module');
const { validateBody } = require('../../kernel/validation/validate');

const svc = require('./services/hr_letters.service');

router.use(requireModule('comms'));

const PreviewSchema = z.object({
  reason: z.string().min(3).optional(),
  template_key: z.string().min(2),
  data: z.record(z.any()).optional(),
}).passthrough();

const IssueSchema = z.object({
  publish_public: z.boolean().optional(),
  public_ttl_days: z.number().int().positive().optional(),
  reason: z.string().min(3),
  template_key: z.string().min(2),
  data: z.record(z.any()).optional(),
  employee_id: z.string().min(1).optional(),
  related: z.record(z.any()).optional(),
}).passthrough();

router.post('/comms/hr_letters/preview', requireCapability('comms.hr_letters'), validateBody(PreviewSchema), async (req, res) => {
  try {
    const out = await svc.previewLetter(req.ctx || {}, req.body || {});
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.code || 'preview_failed', message: String(e.message || e) });
  }
});

router.post('/comms/hr_letters/issue', requireCapability('comms.hr_letters'), validateBody(IssueSchema), async (req, res) => {
  try {
    const out = await svc.issueLetter(req.ctx || {}, req.body || {});
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.code || 'issue_failed', message: String(e.message || e) });
  }
});

module.exports = router;
