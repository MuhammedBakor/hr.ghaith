const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { upsertDefaultKit, getDefaultKit } = require('./brand_kits.service');
const { applyBrandToEntity } = require('./brand_apply.service');

const UpsertSchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','kit'],
  properties:{
    reason:{ type:'string', minLength:2 },
    branch_id:{ type:['number','null'] },
    kit:{ type:'object', additionalProperties:true }
  }
};


const ApplySchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','entity_type','entity_id'],
  properties:{
    reason:{ type:'string', minLength:2 },
    branch_id:{ type:['number','null'] },
    entity_type:{ type:'string', enum:['page','landing','blog_post','profile','terms'] },
    entity_id:{ type:'number' }
  }
};

router.get('/public_site/brand/default',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    const branch_id = req.query.branch_id ? Number(req.query.branch_id) : null;
    const kit = await getDefaultKit(req.ctx, branch_id);
    res.json({ ok:true, kit });
  }
);

router.post('/public_site/brand/default',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'80kb' }),
  validateBody(UpsertSchema),
  async (req,res)=>{
    const { reason, branch_id, kit } = req.body;
    const out = await upsertDefaultKit(req.ctx, { branch_id: branch_id ?? null, kit });
    await audit(req.ctx,{ action:'public_site.brand.default.upsert', entity_type:'brand_kit', entity_id: out.id, reason, meta:{ branch_id: branch_id ?? null }});
    res.json(out);
  }
);


router.post('/public_site/brand/apply',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'40kb' }),
  validateBody(ApplySchema),
  async (req,res)=>{
    const { reason, branch_id, entity_type, entity_id } = req.body;
    const out = await applyBrandToEntity(req.ctx,{ entity_type, entity_id, branch_id: branch_id ?? null });
    if(!out.ok) return res.status(400).json(out);
    await audit(req.ctx,{ action:'public_site.brand.apply', entity_type, entity_id, reason, meta:{ branch_id: branch_id ?? null }});
    res.json(out);
  }
);

module.exports = router;
