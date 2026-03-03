const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { createRequest } = require('./image_requests.service');

const CreateSchema = {
  type:'object',
  additionalProperties:false,
  required:['prompt','reason'],
  properties:{
    prompt:{ type:'string', minLength:5 },
    reason:{ type:'string', minLength:2 },
    branch_id:{ type:['number','null'] },
    meta:{ type:'object', additionalProperties:true }
  }
};

router.post('/marketing/ai/image/request',
  requireAuth, requireOrgScope, requirePerm('marketing:campaigns:write'),
  express.json({ limit:'120kb' }),
  validateBody(CreateSchema),
  async (req,res)=>{
    const { prompt, reason, branch_id, meta } = req.body;
    const out = await createRequest(req.ctx,{ branch_id: branch_id ?? null, prompt, meta });
    await audit(req.ctx,{ action:'marketing.ai.image.request', entity_type:'ai_image_request', entity_id: out.id, reason, meta:{ branch_id: branch_id ?? null }});
    res.json(out);
  }
);

module.exports = router;
