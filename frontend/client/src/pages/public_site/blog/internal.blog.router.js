const express = require('express');
const router = express.Router();
router.use(requireModule('public_site'));
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { createSnapshot } = require('../blocks/services/snapshots.service');

function _env(ctx){
  return {
    txn_id: (ctx.txn_id || ('txn_' + Math.random().toString(36).slice(2,10))),
    org_id: String(ctx.org_id||''),
    branch_id: ctx.branch_id ? String(ctx.branch_id) : undefined,
    actor_id: ctx.actor_id ? String(ctx.actor_id) : undefined,
    occurred_at: new Date().toISOString(),
  };
}

async function ensure(ctx){
  await ctx.db.run(`CREATE TABLE IF NOT EXISTS public_blog_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    website_id BIGINT NULL,
    branch_id BIGINT NULL,
    slug VARCHAR(160) NOT NULL,
    title VARCHAR(220) NOT NULL,
    excerpt TEXT NULL,
    content_json JSON NOT NULL,
    seo_json JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_blog_slug (org_id, slug),
    INDEX idx_blog (org_id, website_id, status, created_at)
  )`);
}

const UpsertSchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','post'],
  properties:{
    reason:{ type:'string', minLength:2 },
    post:{
      type:'object',
      additionalProperties:false,
      required:['slug','title','content'],
      properties:{
        id:{ type:['number','null'] },
        website_id:{ type:['number','null'] },
        branch_id:{ type:['number','null'] },
        slug:{ type:'string', minLength:2 },
        title:{ type:'string', minLength:2 },
        excerpt:{ type:'string' },
        content:{ type:'object', additionalProperties:true }, // { blocks:[] } or { md:"" }
        seo:{ type:['object','null'], additionalProperties:true }
      }
    }
  }
};

router.post('/public_site/blog/upsert',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'600kb' }),
  validateBody(UpsertSchema),
  async (req,res)=>{
    const { reason, post } = req.body;
    await ensure(req.ctx);
    const slug = (post.slug||'').toLowerCase().trim();
    if(!slug) return res.status(400).json({ ok:false, error:'BAD_SLUG' });

    if(post.id){
      await req.ctx.db.run(
        `UPDATE public_blog_posts SET website_id=?, branch_id=?, slug=?, title=?, excerpt=?, content_json=?, seo_json=?, updated_at=NOW()
         WHERE org_id=? AND id=?`,
        [post.website_id ?? null, post.branch_id ?? null, slug, post.title, post.excerpt||null, JSON.stringify(post.content||{}),
         post.seo?JSON.stringify(post.seo):null, req.ctx.org_id, post.id]
      );
      await audit(req.ctx,{ action:'public_site.blog.update', entity_type:'blog_post', entity_id:post.id, reason, meta:{ slug }});
      return 
    // P3.0: publish artifact (doc_no + DMS NOTE)
    try {
      const doc_no = await nextDocNoAsync({ org_id: ctx.org_id, branch_id: ctx.branch_id, kind:'publicsite', prefix:'WEB' });
      const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${doc_no}</title></head><body><h2>نشر الصفحة الرئيسية</h2><p>رقم المستند: <b>${doc_no}</b></p><pre>${JSON.stringify(snapshot || snap || {}, null, 2)}</pre></body></html>`;
      await dms.createFileFromContent(ctx, {
        folder_key: 'publicsite_publishes',
        folder_path: `PUBLICSITE/Home/${doc_no}`,
        filename: `publish_${doc_no}.html`,
        content: html,
        content_type: 'text/html',
        meta: { doc_no, kind:'public_home_publish' }
      });
    } catch(e) {}
res.json({ ok:true, id: post.id });
    }

    const r = await req.ctx.db.run(
      `INSERT INTO public_blog_posts (org_id, website_id, branch_id, slug, title, excerpt, content_json, seo_json)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.ctx.org_id, post.website_id ?? null, post.branch_id ?? null, slug, post.title, post.excerpt||null, JSON.stringify(post.content||{}),
       post.seo?JSON.stringify(post.seo):null]
    );
    const id = (r && (r.insertId||r.lastID)) || null;
    await audit(req.ctx,{ action:'public_site.blog.create', entity_type:'blog_post', entity_id:id, reason, meta:{ slug }});
    res.json({ ok:true, id });
  }
);

router.get('/public_site/blog/list',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:read'),
  async (req,res)=>{
    await ensure(req.ctx);
    const rows = await req.ctx.db.select(
      `SELECT id, slug, title, status, created_at, updated_at
       FROM public_blog_posts WHERE org_id=? ORDER BY id DESC LIMIT 200`,
      [req.ctx.org_id]
    );
    res.json({ ok:true, items: rows });
  }
);

const PublishSchema = {
  type:'object',
  additionalProperties:false,
  required:['post_id','reason'],
  properties:{
    post_id:{ type:'number' },
    reason:{ type:'string', minLength:2 }
  }
};

router.post('/public_site/blog/publish',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'60kb' }),
  validateBody(PublishSchema),
  async (req,res)=>{
    const { post_id, reason } = req.body;
    await ensure(req.ctx);
    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id, slug, title, content_json, seo_json FROM public_blog_posts WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, post_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='blog_post' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, post_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type: 'blog_post',
      entity_id: Number(post_id),
      version_no: nextVer,
      content_json: row.content_json ? JSON.parse(row.content_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: null,
      theme_json: null
    });
    // P2.3: Auto-NOTE published snapshot into DMS (service path: DMS)
    try {
      const payload = {
        website_id: row.website_id||null,
        branch_id: row.branch_id ?? null,
        entity_type: 'blog_post',
        entity_id: Number(post_id),
        version_no: nextVer,
        doc_no: snap.doc_no,
        content_json: snap.content_json || null,
        theme_json: snap.theme_json || null,
        seo_json: snap.seo_json || null,
      };
      const f = await dms.createFileFromContent(req.ctx, {
        folder_key: 'publicsite_snapshots',
        folder_path: `PUBLICSITE/Websites/${row.website_id||'__none__'}/Snapshots/blog_post`,
        filename: `${snap.doc_no}.json`,
        content: JSON.stringify(payload, null, 2),
        content_type: 'application/json',
        meta: { website_id: row.website_id||null, kind:'blog_post', doc_no: snap.doc_no, version_no: nextVer, reason }
      });
      await attachCoreArtifact(req.ctx, {
        entity_type: 'publicsite_website',
        entity_id: String(row.website_id||'__none__'),
        artifact_type: 'report',
        source_module: 'dms',
        source_ref_id: f.id,
        dms_file_id: f.id,
        title: `Snapshot blog_post ${snap.doc_no}`,
        meta: { kind:'blog_post', doc_no: snap.doc_no, version_no: nextVer }
      });
      try { emit(req.app && req.app.get && req.app.get('bus'), 'publicsite.snapshot.published', { ..._env(req.ctx), entity:{ id: snap.doc_no, type:'publicsite_snapshot' }, data:{ website_id: String(row.website_id||''), kind:'blog_post', doc_no: snap.doc_no, version_no: nextVer } }); } catch(e){}
    } catch(e) {}


    await req.ctx.db.run(`UPDATE public_blog_posts SET status='published', updated_at=NOW() WHERE org_id=? AND id=?`, [req.ctx.org_id, post_id]);
    await audit(req.ctx,{ action:'public_site.blog.publish', entity_type:'blog_post', entity_id:post_id, reason, meta:{ doc_no:snap.doc_no, slug: row.slug, version_no: nextVer }});
    res.json({ ok:true, doc_no:snap.doc_no, slug: row.slug, version_no: nextVer });
  }
);

module.exports = router;
