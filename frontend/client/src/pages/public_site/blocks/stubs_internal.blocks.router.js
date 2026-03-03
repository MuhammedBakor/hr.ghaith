const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { audit } = require('../../../kernel/audit.NOTE');
const { setPageBlocks, getPageBlocks } = require('../services/blocks.service');

const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

const { generateBlocks } = require('../services/ai_blocks.service');
const { createSnapshot, listSnapshots } = require('../services/snapshots.service');
const { buildProfile, blocksForProfile } = require('../../website/services/branch_profile_auto.service');

function readPresets(){
  const p = path.join(__dirname, '..', 'presets', 'presets.json');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

router.get('/public_site/blocks/registry',
  requireAuth, requireOrgScope, requirePerm('public_site:blocks:read'),
  async (req,res)=>{
    const reg = JSON.parse(fs.readFileSync(path.join(__dirname,'..','registry.json'),'utf-8'));
    res.json({ ok:true, registry: reg });
  }
);

router.get('/public_site/blocks/presets',
  requireAuth, requireOrgScope, requirePerm('public_site:blocks:read'),
  async (req,res)=>{
    res.json({ ok:true, ...readPresets() });
  }
);

router.get('/public_site/pages/:page_id/blocks',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:update'),
  async (req,res)=>{
    const out = await getPageBlocks(req.ctx, req.params.page_id);
    if(!out.ok) return res.status(404).json(out);
    res.json(out);
  }
);

router.put('/public_site/pages/:page_id/blocks', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:update'),
  express.json({ limit:'400kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const blocks = Array.isArray(req.body.blocks) ? req.body.blocks : [];
    const out = await setPageBlocks(req.ctx, req.params.page_id, blocks);
    if(!out.ok) return res.status(404).json(out);

    await audit(req.ctx,{ action:'public_site.page.blocks.update', entity_type:'public_page', entity_id:req.params.page_id, reason, meta:{ blocks_count: blocks.length } });
    res.json({ ok:true });
  }
);

router.post('/public_site/ai/generate-blocks', validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:blocks:ai'),
  express.json({ limit:'120kb' }),
  async (req,res)=>{
    const blocks = generateBlocks(req.body||{});
    res.json({ ok:true, blocks });
  }
);

router.post('/public_site/ai/generate-and-apply/:page_id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:blocks:ai'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const blocks = generateBlocks(req.body||{});
    const out = await setPageBlocks(req.ctx, req.params.page_id, blocks);
    if(!out.ok) return res.status(404).json(out);

    await audit(req.ctx,{ action:'public_site.page.blocks.ai_apply', entity_type:'public_page', entity_id:req.params.page_id, reason, meta:{ blocks_count: blocks.length } });
    res.json({ ok:true, blocks });
  }
);


router.post('/public_site/pages/:page_id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    // Load page
    const row = await req.ctx.db.selectOne(`SELECT id, website_id, content_json, seo_json, visibility_json FROM public_pages WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.page_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    // Determine next version
    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='page' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, req.params.page_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type:'page',
      entity_id: Number(req.params.page_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      // theme is fetched from public_brand_settings by website
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.page.publish', entity_type:'public_page', entity_id:req.params.page_id, reason, meta:{ doc_no: snap.doc_no, version_no: nextVer } });
    res.json({ ok:true, ...snap, version_no: nextVer });
  }
);

router.get('/public_site/pages/:page_id/snapshots',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const out = await listSnapshots(req.ctx,'page', Number(req.params.page_id));
    res.json(out);
  }
);


router.post('/public_site/landing/:landing_id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id AS website_id, blocks_json AS content_json, seo_json AS seo_json, visibility_json AS visibility_json
       FROM public_landing_pages WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.landing_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='landing' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, req.params.landing_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type:'landing',
      entity_id: Number(req.params.landing_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.landing.publish', entity_type:'landing', entity_id:req.params.landing_id, reason, meta:{ doc_no: snap.doc_no, version_no: nextVer } });
    res.json({ ok:true, ...snap, version_no: nextVer });
  }
);

router.get('/public_site/landing/:landing_id/snapshots',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const out = await listSnapshots(req.ctx,'landing', Number(req.params.landing_id));
    res.json(out);
  }
);

router.post('/public_site/blog_post/:post_id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id AS website_id, content_json AS content_json, seo_json AS seo_json, visibility_json AS visibility_json
       FROM public_blog_posts WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.post_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='blog_post' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, req.params.post_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type:'blog_post',
      entity_id: Number(req.params.post_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.blog_post.publish', entity_type:'blog_post', entity_id:req.params.post_id, reason, meta:{ doc_no: snap.doc_no, version_no: nextVer } });
    res.json({ ok:true, ...snap, version_no: nextVer });
  }
);

router.get('/public_site/blog_post/:post_id/snapshots',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const out = await listSnapshots(req.ctx,'blog_post', Number(req.params.post_id));
    res.json(out);
  }
);

router.post('/public_site/profile/:profile_id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id AS website_id, profile_json AS content_json, seo_json AS seo_json, visibility_json AS visibility_json
       FROM public_branch_profiles WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.profile_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='profile' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, req.params.profile_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type:'profile',
      entity_id: Number(req.params.profile_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.profile.publish', entity_type:'profile', entity_id:req.params.profile_id, reason, meta:{ doc_no: snap.doc_no, version_no: nextVer } });
    res.json({ ok:true, ...snap, version_no: nextVer });
  }
);

router.get('/public_site/profile/:profile_id/snapshots',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const out = await listSnapshots(req.ctx,'profile', Number(req.params.profile_id));
    res.json(out);
  }
);

router.post('/public_site/terms/:page_id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id AS website_id, content_json AS content_json, seo_json AS seo_json, visibility_json AS visibility_json
       FROM public_pages WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.page_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='terms' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, req.params.page_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type:'terms',
      entity_id: Number(req.params.page_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.terms.publish', entity_type:'terms', entity_id:req.params.page_id, reason, meta:{ doc_no: snap.doc_no, version_no: nextVer } });
    res.json({ ok:true, ...snap, version_no: nextVer });
  }
);

router.get('/public_site/terms/:page_id/snapshots',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const out = await listSnapshots(req.ctx,'terms', Number(req.params.page_id));
    res.json(out);
  }
);


router.post('/public_site/profile/:profile_id/auto-generate-blocks', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'200kb' }),
  async (req,res)=>{
    const reason = req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, profile_json FROM public_branch_profiles WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, req.params.profile_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const existing = row.profile_json ? JSON.parse(row.profile_json) : {};
    const merged = Object.assign(buildProfile(req.body||{}), existing);
    const blocks = blocksForProfile(merged);

    await req.ctx.db.run(
      `UPDATE public_branch_profiles SET profile_json=? , updated_at=NOW() WHERE org_id=? AND id=?`,
      [JSON.stringify(merged), req.ctx.org_id, req.params.profile_id]
    );

    // also store blocks into profile_json.blocks for renderer
    merged.blocks = blocks;
    await req.ctx.db.run(
      `UPDATE public_branch_profiles SET profile_json=? , updated_at=NOW() WHERE org_id=? AND id=?`,
      [JSON.stringify(merged), req.ctx.org_id, req.params.profile_id]
    );

    await audit(req.ctx,{ action:'public_site.profile.auto_blocks', entity_type:'profile', entity_id:req.params.profile_id, reason, meta:{ blocks_count: blocks.length }});
    res.json({ ok:true, blocks_count: blocks.length, blocks });
  }
);

module.exports = router;