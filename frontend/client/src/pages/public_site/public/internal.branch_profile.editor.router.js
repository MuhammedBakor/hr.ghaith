const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');

const UpsertSchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','profile'],
  properties:{
    reason:{ type:'string', minLength:2 },
    id:{ type:['number','null'] },
    website_id:{ type:['number','null'] },
    branch_id:{ type:['number','null'] },
    slug:{ type:'string', minLength:2 },
    profile:{
      type:'object',
      additionalProperties:true
    },
    seo:{ type:['object','null'], additionalProperties:true },
    theme:{ type:['object','null'], additionalProperties:true }
  }
};

router.post('/public_site/branches/upsert',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'220kb' }),
  validateBody(UpsertSchema),
  async (req,res)=>{
    const { reason, id, website_id, branch_id, slug, profile, seo, theme } = req.body;

    // ensure table exists (best-effort)
    await req.ctx.db.run(`CREATE TABLE IF NOT EXISTS public_branch_profiles (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      org_id BIGINT NOT NULL,
      website_id BIGINT NULL,
      branch_id BIGINT NULL,
      slug VARCHAR(120) NOT NULL,
      profile_json JSON NOT NULL,
      seo_json JSON NULL,
      theme_json JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      UNIQUE KEY uq_branch_slug (org_id, slug)
    )`);

    if(id){
      await req.ctx.db.run(
        `UPDATE public_branch_profiles SET website_id=?, branch_id=?, slug=?, profile_json=?, seo_json=?, theme_json=?, updated_at=NOW()
         WHERE org_id=? AND id=?`,
        [website_id, branch_id, slug, JSON.stringify(profile||{}), seo?JSON.stringify(seo):null, theme?JSON.stringify(theme):null, req.ctx.org_id, id]
      );
      await audit(req.ctx,{ action:'public_site.branch_profile.update', entity_type:'branch_profile', entity_id:id, reason, meta:{ slug }});
      return res.json({ ok:true, id });
    }

    const r = await req.ctx.db.run(
      `INSERT INTO public_branch_profiles (org_id, website_id, branch_id, slug, profile_json, seo_json, theme_json)
       VALUES (?,?,?,?,?,?,?)`,
      [req.ctx.org_id, website_id, branch_id, slug, JSON.stringify(profile||{}), seo?JSON.stringify(seo):null, theme?JSON.stringify(theme):null]
    );
    const newId = (r && (r.insertId||r.lastID)) || null;
    await audit(req.ctx,{ action:'public_site.branch_profile.create', entity_type:'branch_profile', entity_id:newId, reason, meta:{ slug }});
    res.json({ ok:true, id:newId });
  }
);

module.exports = router;
