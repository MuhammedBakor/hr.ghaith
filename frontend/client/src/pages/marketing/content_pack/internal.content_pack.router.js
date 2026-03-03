const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { getDefaultKit } = require('../../public_site/brand/brand_kits.service');
const { buildPack } = require('./content_pack.service');

const BuildSchema = {
  type:'object',
  additionalProperties:false,
  required:['campaign','reason'],
  properties:{
    reason:{ type:'string', minLength:2 },
    branch_id:{ type:['number','null'] },
    language:{ type:'string', enum:['ar','en','hi'] },
    campaign:{
      type:'object',
      additionalProperties:false,
      required:['name'],
      properties:{
        name:{ type:'string', minLength:2 },
        slug:{ type:'string' },
        city:{ type:'string' },
        offer:{ type:'string' }
      }
    }
  }
};

router.post('/marketing/content-pack/build',
  requireAuth, requireOrgScope, requirePerm('marketing:campaigns:write'),
  express.json({ limit:'120kb' }),
  validateBody(BuildSchema),
  async (req,res)=>{
    const { campaign, reason, branch_id, language } = req.body;
    const brand = await getDefaultKit(req.ctx, branch_id ?? null);
    const pack = buildPack({ brand, campaign, language: language || 'ar' });
    await audit(req.ctx,{ action:'marketing.content_pack.build', entity_type:'campaign', entity_id:null, reason, meta:{ branch_id: branch_id ?? null }});
    res.json({ ok:true, brand:{ name: brand.name, tone: brand.tone }, pack });
  }
);

module.exports = router;
