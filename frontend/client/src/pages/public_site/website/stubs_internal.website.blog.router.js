const { validateBody, validateParams } = require('../../../../kernel/validation/validate.js');
const { z } = require('zod');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth, requireOrgScope, requirePerm } = require('../../../kernel/internalGuards.NOTE');
const { audit } = require('../../../kernel/audit.NOTE');
const { safeText } = require('../../../kernel/sanitize.NOTE');
const { publishPost } = require('../services/blog_publish.service');


const ReasonSchema = z.object({ reason: z.string().min(3) }).passthrough();
const IdParamSchema = z.object({ id: z.string().min(1) }).passthrough();

function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function slugify(s){
  return String(s||'').trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g,'')
    .replace(/\s+/g,'-').replace(/-+/g,'-')
    .slice(0,180);
}

router.get('/websites/:website_id/blog/posts',
  requireAuth, requireOrgScope, requirePerm('public_site:blog:read'),
  async (req,res)=>{
    const rows = await req.ctx.db.selectMany(
      `SELECT id, slug, title, excerpt, cover_asset_id, status, published_at, updated_at
       FROM public_blog_posts WHERE website_id=? ORDER BY updated_at DESC LIMIT 200`,
      [req.params.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.post('/websites/:website_id/blog/posts', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:blog:create'),
  express.json({ limit:'900kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const id=uuid();
    const title=safeText(req.body?.title||'مقال جديد',190);
    const slug=safeText(req.body?.slug||slugify(title),190);

    await req.ctx.db.run(
      `INSERT INTO public_blog_posts
       (id, org_id, website_id, slug, title, excerpt, content_md, cover_asset_id, seo_json, status, created_by, updated_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'DRAFT',?, ?, NOW(), NOW())`,
      [id, req.ctx.org_id, req.params.website_id, slug, title, safeText(req.body?.excerpt||'',600)||null, req.body?.content_md||null, req.body?.cover_asset_id||null, JSON.stringify(req.body?.seo_json||{}), req.ctx.actor_id, req.ctx.actor_id]
    );

    await audit(req.ctx,{ action:'public_site.blog.create', entity_type:'public_blog_post', entity_id:id, reason, meta:{ website_id:req.params.website_id, slug } });
    res.json({ ok:true, id, slug });
  }
);

router.patch('/blog/posts/:id', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:blog:update'),
  express.json({ limit:'900kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const patch={};
    for(const k of ['slug','title','excerpt','content_md','cover_asset_id','seo_json','status']){
      if(req.body?.[k] !== undefined) patch[k]=req.body[k];
    }

    const sets=[]; const vals=[];
    for(const [k,v] of Object.entries(patch)){
      if(k==='seo_json'){ sets.push(`${k}=?`); vals.push(JSON.stringify(v||{})); }
      else if(k==='title'){ sets.push(`${k}=?`); vals.push(safeText(v||'',190)); }
      else if(k==='slug'){ sets.push(`${k}=?`); vals.push(safeText(v||'',190)); }
      else if(k==='excerpt'){ sets.push(`${k}=?`); vals.push(safeText(v||'',600)||null); }
      else if(k==='status'){ sets.push(`${k}=?`); vals.push(String(v||'DRAFT').toUpperCase()); }
      else { sets.push(`${k}=?`); vals.push(v); }
    }
    sets.push(`updated_by=?`); vals.push(req.ctx.actor_id);
    sets.push(`updated_at=NOW()`);

    vals.push(req.ctx.org_id, req.params.id);
    await req.ctx.db.run(`UPDATE public_blog_posts SET ${sets.join(', ')} WHERE org_id=? AND id=?`, vals);
    await audit(req.ctx,{ action:'public_site.blog.update', entity_type:'public_blog_post', entity_id:req.params.id, reason, meta:{ patch:Object.keys(patch) } });
    res.json({ ok:true });
  }
);

router.post('/blog/posts/:id/publish', validateParams(IdParamSchema), validateBody(ReasonSchema),
  requireAuth, requireOrgScope, requirePerm('public_site:blog:publish'),
  express.json({ limit:'50kb' }),
  async (req,res)=>{
    const reason=req.body?.reason;
    if(!reason) return res.status(400).json({ ok:false, error:'REASON_REQUIRED' });

    const out = await publishPost(req.ctx, { post_id:req.params.id, reason });
    await audit(req.ctx,{ action:'public_site.blog.publish', entity_type:'public_blog_post', entity_id:req.params.id, reason, meta:{ snapshot_id:out.snapshot_id, doc_no:out.doc_no } });
    res.json(out);
  }
);

module.exports = router;