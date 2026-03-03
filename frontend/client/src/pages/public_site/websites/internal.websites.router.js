const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');

const UpsertSchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','website'],
  properties:{
    reason:{ type:'string', minLength:2 },
    website:{
      type:'object',
      additionalProperties:false,
      required:['domain'],
      properties:{
        id:{ type:['number','null'] },
        domain:{ type:'string', minLength:3 },
        name:{ type:'string' },
        branch_id:{ type:['number','null'] },
        is_active:{ type:'boolean' },
        default_locale:{ type:'string', enum:['ar','en','hi'] }
      }
    }
  }
};

async function ensure(ctx){
  await ctx.db.run(`CREATE TABLE IF NOT EXISTS public_websites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    branch_id BIGINT NULL,
    domain VARCHAR(190) NOT NULL,
    name VARCHAR(120) NULL,
    is_active TINYINT NOT NULL DEFAULT 1,
    default_locale VARCHAR(5) NOT NULL DEFAULT 'ar',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_domain (org_id, domain)
  )`);
}

router.post('/public_site/websites/upsert',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'60kb' }),
  validateBody(UpsertSchema),
  async (req,res)=>{
    const { reason, website } = req.body;
    await ensure(req.ctx);
    const domain = (website.domain||'').toLowerCase().trim();
    if(!domain) return res.status(400).json({ ok:false, error:'BAD_DOMAIN' });

    if(website.id){
      await req.ctx.db.run(
        `UPDATE public_websites SET domain=?, name=?, branch_id=?, is_active=?, default_locale=?, updated_at=NOW()
         WHERE org_id=? AND id=?`,
        [domain, website.name||null, website.branch_id ?? null, website.is_active===false?0:1, website.default_locale||'ar', req.ctx.org_id, website.id]
      );
      await audit(req.ctx,{ action:'public_site.website.update', entity_type:'website', entity_id:website.id, reason, meta:{ domain }});
      return res.json({ ok:true, id: website.id });
    }

    const r = await req.ctx.db.run(
      `INSERT INTO public_websites (org_id, branch_id, domain, name, is_active, default_locale)
       VALUES (?,?,?,?,?,?)`,
      [req.ctx.org_id, website.branch_id ?? null, domain, website.name||null, website.is_active===false?0:1, website.default_locale||'ar']
    );
    const id = (r && (r.insertId || r.lastID)) || null;
    await audit(req.ctx,{ action:'public_site.website.create', entity_type:'website', entity_id:id, reason, meta:{ domain }});
    res.json({ ok:true, id });
  }
);

router.get('/public_site/websites/list',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    await ensure(req.ctx);
    const rows = await req.ctx.db.select(
      `SELECT id, domain, name, branch_id, is_active, default_locale, created_at
       FROM public_websites WHERE org_id=? ORDER BY id DESC LIMIT 200`,
      [req.ctx.org_id]
    );
    res.json({ ok:true, items: rows });
  }
);

module.exports = router;
