// PublicSite NOTE Helper (P2.1)
const express = require('express');
const router = express.Router();
const requireCapability = require('../../kernel/subscription/require_capability');
const { z } = require('zod');
const { validateBody } = require('../../kernel/validation/validate');
const dms = require('../dms/services/files.service');
const { attachCoreArtifact } = require('../../kernel/artifacts/core_artifacts.service');

const Body = z.object({
  reason: z.string().min(3),
  website_id: z.string().min(1),
  snapshot_id: z.string().min(1),
  kind: z.string().min(1), // home/blog/page/landing/profile
  payload_json: z.record(z.any())
}).passthrough();

router.post('/public_site/NOTE/snapshot', requireCapability('public_site.core'), validateBody(Body), async (req, res) => {
  const ctx = req.ctx || {};
  const { website_id, snapshot_id, kind, payload_json } = req.body;

  const file = await dms.createFileFromContent(ctx, {
    folder_key: 'publicsite_snapshots',
    folder_path: `PUBLICSITE/Websites/${website_id}/Snapshots/${kind}`,
    filename: `${snapshot_id}.json`,
    content: JSON.stringify(payload_json || {}, null, 2),
    content_type: 'application/json',
    meta: { website_id, snapshot_id, kind, reason: req.body.reason }
  });

  await attachCoreArtifact(ctx, {
    entity_type: 'publicsite_website',
    entity_id: website_id,
    artifact_type: 'report',
    source_module: 'dms',
    source_ref_id: file.id,
    dms_file_id: file.id,
    title: `Snapshot ${kind} ${snapshot_id}`,
    meta: { website_id, snapshot_id, kind }
  });

  res.json({ status:'NOTE', dms_file_id: file.id });
});

module.exports = router;
