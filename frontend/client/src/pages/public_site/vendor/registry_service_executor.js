const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../../kernel/validate.NOTE');

const ExecuteSchema = {
  type:'object',
  additionalProperties:false,
  required:['code','version','input','reason'],
  properties:{
    code:{ type:'string', minLength:3 },
    version:{ type:'string', minLength:3 },
    input:{ type:'object', additionalProperties:true },
    reason:{ type:'string', minLength:2 }
  }
};

async function execute(ctx, code, version, input, reason){
  if(code === 'PUBLIC_STUDIO_SAVE'){
    const { type, target, payload } = input || {};
    if(type === 'landing_compiled'){
      const id = Number(target?.landing_id);
      if(!id) return { ok:false, error:'landing_id required' };
      const row = await ctx.db.selectOne(`SELECT id FROM public_landing_pages WHERE org_id=? AND id=? LIMIT 1`, [ctx.org_id, id]);
      if(!row) return { ok:false, error:'NOT_FOUND' };
      await ctx.db.run(`UPDATE public_landing_pages SET blocks_json=?, updated_at=NOW() WHERE org_id=? AND id=?`, [JSON.stringify(payload||{}), ctx.org_id, id]);
    }
    await audit(ctx,{ action:'public_site.service.PUBLIC_STUDIO_SAVE', entity_type:'service', entity_id:null, reason, meta:{ type }});
    return { ok:true };
  }

  if(code === 'PUBLIC_BRAND_APPLY'){
    const { applyBrandToEntity } = require('../../brand/brand_apply.service');
    const entity_type = input?.entity_type;
    const entity_id = Number(input?.entity_id);
    const branch_id = (input?.branch_id ?? null);
    const auto_brand = (input?.auto_brand ?? true);
    if(!entity_type || !entity_id) return { ok:false, error:'entity_type + entity_id required' };
    const out = await applyBrandToEntity(ctx,{ entity_type, entity_id, branch_id });
    if(!out.ok) return out;
    await audit(ctx,{ action:'public_site.service.PUBLIC_BRAND_APPLY', entity_type, entity_id, reason, meta:{ branch_id } });
    return { ok:true, ...out };
  }

  if(code === 'PUBLIC_STUDIO_APPLY_PRESET'){
    const fs = require('fs'); const path = require('path');
    const preset_id = input?.preset_id;
    const page_id = Number(input?.target?.page_id);
    if(!preset_id || !page_id) return { ok:false, error:'preset_id + target.page_id required' };
    const presetsPath = path.join(__dirname,'..','..','blocks','presets','presets.json');
    const preset = (JSON.parse(fs.readFileSync(presetsPath,'utf-8')).presets||[]).find(p=>p.id===preset_id);
    if(!preset) return { ok:false, error:'PRESET_NOT_FOUND' };
    const row = await ctx.db.selectOne(`SELECT content_json FROM public_pages WHERE org_id=? AND id=? LIMIT 1`, [ctx.org_id, page_id]);
    if(!row) return { ok:false, error:'PAGE_NOT_FOUND' };
    const cj = row.content_json ? JSON.parse(row.content_json) : {};
    cj.blocks = preset.blocks||[];
    cj.theme = preset.theme||cj.theme||null;
    await ctx.db.run(`UPDATE public_pages SET content_json=?, updated_at=NOW() WHERE org_id=? AND id=?`, [JSON.stringify(cj), ctx.org_id, page_id]);
    await audit(ctx,{ action:'public_site.service.PUBLIC_STUDIO_APPLY_PRESET', entity_type:'public_page', entity_id:page_id, reason, meta:{ preset_id }});
    return { ok:true, page_id, blocks_count: (cj.blocks||[]).length };
  }

  return { ok:false, error:'SERVICE_NOT_IMPLEMENTED', code, version };
}

router.post('/public_site/services/execute',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'300kb' }),
  validateBody(ExecuteSchema),
  async (req,res)=>{
    const { code, version, input, reason } = req.body;
    const out = await execute(req.ctx, code, version, input, reason);
    res.json(out);
  }
);

module.exports = router;
