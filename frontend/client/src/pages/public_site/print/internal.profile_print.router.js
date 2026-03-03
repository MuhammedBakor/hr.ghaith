const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { createSnapshot } = require('../blocks/services/snapshots.service');
const { getDefaultKit } = require('../brand/brand_kits.service');
const { renderProfileHtml } = require('./profile_print.service');

const PublishProfileSchema = {
  type:'object',
  additionalProperties:false,
  required:['profile_id','reason'],
  properties:{
    profile_id:{ type:'number' },
    branch_id:{ type:['number','null'] },
    reason:{ type:'string', minLength:2 }
  }
};

router.post('/public_site/profile/publish',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'80kb' }),
  validateBody(PublishProfileSchema),
  async (req,res)=>{
    const { profile_id, branch_id, reason } = req.body;
    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id, profile_json, seo_json, visibility_json
       FROM public_branch_profiles WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, profile_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='profile' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, profile_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type: 'profile',
      entity_id: Number(profile_id),
      version_no: nextVer,
      content_json: row.profile_json ? JSON.parse(row.profile_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    // Brand kit applied into print, not mutating profile JSON on publish
    const kit = await getDefaultKit(req.ctx, branch_id ?? null);

    await audit(req.ctx,{ action:'public_site.profile.publish', entity_type:'profile', entity_id: profile_id, reason, meta:{ doc_no:snap.doc_no, version_no: nextVer }});

    res.json({ ok:true, doc_no:snap.doc_no, version_no: nextVer, brand: { name: kit.name } });
  }
);

router.get('/public_site/profile/print/:doc_no',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const doc_no = String(req.params.doc_no||'').trim();
    const snap = await req.ctx.db.selectOne(
      `SELECT doc_no, entity_type, entity_id, version_no, content_json FROM public_content_snapshots WHERE org_id=? AND doc_no=? LIMIT 1`,
      [req.ctx.org_id, doc_no]
    );
    if(!snap) return res.status(404).send('NOT_FOUND');
    const content = snap.content_json ? JSON.parse(snap.content_json) : {};
    const kit = await getDefaultKit(req.ctx, null);
    const html = await renderProfileHtml(req.ctx, { snapshot: { doc_no: snap.doc_no, version_no: snap.version_no, verify_url:'/public/verify/'+snap.doc_no }, profile_json: content, brand_kit: kit });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }
);

module.exports = router;
