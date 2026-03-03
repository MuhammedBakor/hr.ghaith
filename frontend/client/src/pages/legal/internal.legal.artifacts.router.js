const express = require('express');
const router = express.Router();
router.use(requireModule('legal'));
const requireCapability = require('../../kernel/subscription/require_capability');
const requireModule = require('../../kernel/subscription/require_module');
const { z } = require('zod');
const { validateParams } = require('../../kernel/validation/validate');
const { listCoreArtifacts } = require('../../kernel/artifacts/core_artifacts.service');

const Params = z.object({ id: z.string().min(1) });

router.get('/legal/cases/:id/artifacts', requireCapability('legal.core'), validateParams(Params), async (req, res) => {
  const ctx = req.ctx || {};
  const limit = Number(req.query.limit || 200);
  const offset = Number(req.query.offset || 0);
  const artifact_type = req.query.type ? String(req.query.type) : null;
  const items = await listCoreArtifacts(ctx, { entity_type:'legal_case', entity_id:req.params.id, artifact_type, limit, offset });
  res.json({ case_id: req.params.id, items });
});

module.exports = router;
