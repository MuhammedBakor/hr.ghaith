const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../../kernel/validate.NOTE');
const fs = require('fs');
const path = require('path');

function loadPresets(){
  const p = path.join(__dirname,'..','..','blocks','presets','presets.json');
  return JSON.parse(fs.readFileSync(p,'utf-8'));
}

const SaveStudioAssetSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type','payload','reason'],
  properties: {
    type: { type:'string', enum:['page_blocks','page_richtext','landing_compiled','email_template'] },
    target: { type:'object', additionalProperties:true },
    payload: { type:'object', additionalProperties:true },
    reason: { type:'string', minLength: 2 }
  }
};


const ApplyPresetSchema = {
  type:'object',
  additionalProperties:false,
  required:['preset_id','target','reason'],
  properties:{
    branch_id:{ type:['number','null'] },
    preset_id:{ type:'string', minLength:2 },
    target:{ type:'object', additionalProperties:true },
    reason:{ type:'string', minLength:2 }
  }
};

router.post('/public_site/studio/save',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'300kb' }),
  validateBody(SaveStudioAssetSchema),
  async (req,res)=>{
    // This is a platform-safe collector endpoint:
    // - validates envelope
    // - stores payload into target entity (best-effort) using our existing tables
    const { type, target, payload, reason } = req.body;

    if(type === 'landing_compiled'){
      const id = Number(target?.landing_id);
      if(!id) return res.status(400).json({ ok:false, error:'landing_id required' });
      const row = await req.ctx.db.selectOne(`SELECT id FROM public_landing_pages WHERE org_id=? AND id=? LIMIT 1`, [req.ctx.org_id, id]);
      if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
      await req.ctx.db.run(
        `UPDATE public_landing_pages SET blocks_json=?, updated_at=NOW() WHERE org_id=? AND id=?`,
        [JSON.stringify(payload||{}), req.ctx.org_id, id]
      );
    }

    // NOTE: add other types mapping once UI wiring is finalized
    await audit(req.ctx,{ action:'public_site.studio.save', entity_type:'marketing_studio', entity_id:null, reason, meta:{ type }});
    res.json({ ok:true });
  }
);


router.post('/public_site/studio/apply-preset',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'80kb' }),
  validateBody(ApplyPresetSchema),
  async (req,res)=>{
    const { preset_id, target, reason } = req.body;
    const presets = loadPresets().presets || [];
    const preset = presets.find(p=>p.id===preset_id);
    if(!preset) return res.status(404).json({ ok:false, error:'PRESET_NOT_FOUND' });

    // target supports page_id
    const page_id = Number(target?.page_id);
    if(!page_id) return res.status(400).json({ ok:false, error:'page_id required in target' });

    const row = await req.ctx.db.selectOne(`SELECT content_json FROM public_pages WHERE org_id=? AND id=? LIMIT 1`, [req.ctx.org_id, page_id]);
    if(!row) return res.status(404).json({ ok:false, error:'PAGE_NOT_FOUND' });

    const cj = row.content_json ? JSON.parse(row.content_json) : {};
    cj.blocks = preset.blocks || [];
    cj.theme = preset.theme || cj.theme || null;
    // Optional: apply Brand Kit theme overlay (per branch)
    const branch_id = (req.body.branch_id ?? null);
    if(branch_id !== null){
      const kit = await getDefaultKit(req.ctx, branch_id);
      cj.theme = { ...(cj.theme||{}), primary: kit.primary, secondary: kit.secondary, font_family: kit.font_family, brand_kit_applied:true, brand_branch_id: branch_id };
    }

    await req.ctx.db.run(`UPDATE public_pages SET content_json=?, updated_at=NOW() WHERE org_id=? AND id=?`, [JSON.stringify(cj), req.ctx.org_id, page_id]);
    await audit(req.ctx,{ action:'public_site.studio.apply_preset', entity_type:'public_page', entity_id:page_id, reason, meta:{ preset_id }});
    res.json({ ok:true, preset_id, page_id, blocks_count: (cj.blocks||[]).length });
  }
);


const PublishSchema = {
  type:'object',
  additionalProperties:false,
  required:['entity_type','entity_id','reason'],
  properties:{
    entity_type:{ type:'string', enum:['page','landing','blog_post','profile','terms'] },
    entity_id:{ type:'number' },
    reason:{ type:'string', minLength:2 }
  }
};


const { createSnapshot } = require('../../blocks/services/snapshots.service');
const { getDefaultKit } = require('../../brand/brand_kits.service');

router.post('/public_site/studio/publish',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'80kb' }),
  validateBody(PublishSchema),
  async (req,res)=>{
    const { entity_type, entity_id, reason } = req.body;

    // resolve table/columns
    const map = {
      page: { table:'public_pages', content:'content_json', seo:'seo_json', vis:'visibility_json', website:'website_id' },
      landing: { table:'public_landing_pages', content:'blocks_json', seo:'seo_json', vis:'visibility_json', website:'website_id' },
      blog_post: { table:'public_blog_posts', content:'content_json', seo:'seo_json', vis:'visibility_json', website:'website_id' },
      profile: { table:'public_branch_profiles', content:'profile_json', seo:'seo_json', vis:'visibility_json', website:'website_id' },
      terms: { table:'public_pages', content:'content_json', seo:'seo_json', vis:'visibility_json', website:'website_id' },
    };
    const cfg = map[entity_type];
    if(!cfg) return res.status(400).json({ ok:false, error:'BAD_ENTITY' });

    const row = await req.ctx.db.selectOne(
      `SELECT id, ${cfg.website} AS website_id, ${cfg.content} AS content_json, ${cfg.seo} AS seo_json, ${cfg.vis} AS visibility_json
       FROM ${cfg.table} WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, entity_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type=? AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, entity_type, entity_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type,
      entity_id: Number(entity_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: row.visibility_json ? JSON.parse(row.visibility_json) : null,
      theme_json: null
    });

    await audit(req.ctx,{ action:'public_site.studio.publish', entity_type, entity_id, reason, meta:{ doc_no:snap.doc_no, version_no: nextVer }});
    res.json({ ok:true, doc_no:snap.doc_no, version_no: nextVer });
  }
);

module.exports = router;
