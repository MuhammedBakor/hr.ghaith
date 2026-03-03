const express = require('express');
const router = express.Router();
const { getDefaultKit } = require('../brand/brand_kits.service');
const { renderBranchProfilePage, renderVerifyPage, renderHomePage, renderBlogListPage, renderBlogPostPage } = require('./renderer.service');

// Resolve website_id by host (NOTE): in main platform, use a websites table mapping domain->website_id
async function resolveWebsiteId(ctx, req){
  const q = req.query.website_id ? Number(req.query.website_id) : null;
  if(q) return q;
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(':')[0].toLowerCase();
  if(!host) return null;
  try{
    const row = await ctx.db.selectOne(`SELECT id FROM public_websites WHERE org_id=? AND domain=? LIMIT 1`, [ctx.org_id, host]);
    return row ? row.id : null;
  }catch(e){
    return null;
  }
}

router.get('/public/branches/:slug', async (req,res)=>{
  const slug = String(req.params.slug||'').trim();
  if(!slug) return res.status(400).send('BAD_SLUG');
  const website_id = await resolveWebsiteId(req.ctx, req);
  try{
    const row = await req.ctx.db.selectOne(
      `SELECT id, branch_id, profile_json, theme_json, seo_json
       FROM public_branch_profiles
       WHERE org_id=? AND slug=? ${website_id ? 'AND website_id=?' : ''}
       LIMIT 1`,
      website_id ? [req.ctx.org_id, slug, website_id] : [req.ctx.org_id, slug]
    );
    if(!row) return res.status(404).send('NOT_FOUND');

    const profile = row.profile_json ? JSON.parse(row.profile_json) : {};
    const theme = row.theme_json ? JSON.parse(row.theme_json) : null;
    const seo = row.seo_json ? JSON.parse(row.seo_json) : null;
    profile.theme = { ...(profile.theme||{}), ...(theme||{}) };
    if(seo){ profile.seo_description = seo.description || ''; }

    const brand = await getDefaultKit(req.ctx, row.branch_id ?? null);
    const html = await renderBranchProfilePage({ profile, brand });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }catch(e){
    res.status(500).send('SERVER_ERROR');
  }
});

router.get('/public/verify/:doc_no/page', async (req,res)=>{
  const doc_no = String(req.params.doc_no||'').trim();
  try{
    const row = await req.ctx.db.selectOne(
      `SELECT doc_no, entity_type, entity_id, version_no, created_at
       FROM public_content_snapshots WHERE org_id=? AND doc_no=? LIMIT 1`,
      [req.ctx.org_id, doc_no]
    );
    const html = await renderVerifyPage({ doc_no, status: row?'ok':'not_found', snapshot: row||{} });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }catch(e){
    const html = await renderVerifyPage({ doc_no, status:'not_found', snapshot:{} });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }
});


router.get('/public/home', async (req,res)=>{
  const website_id = await resolveWebsiteId(req.ctx, req);
  try{
    // latest published home snapshot for website (or org-wide)
    let row = null;
    if(website_id){
      row = await req.ctx.db.selectOne(
        `SELECT content_json, theme_json, seo_json FROM public_content_snapshots
         WHERE org_id=? AND entity_type='home' AND website_id=? ORDER BY id DESC LIMIT 1`,
        [req.ctx.org_id, website_id]
      );
    }
    if(!row){
      row = await req.ctx.db.selectOne(
        `SELECT content_json, theme_json, seo_json FROM public_content_snapshots
         WHERE org_id=? AND entity_type='home' ORDER BY id DESC LIMIT 1`,
        [req.ctx.org_id]
      );
    }
    if(!row) return res.status(404).send('HOME_NOT_FOUND');
    const content = row.content_json ? JSON.parse(row.content_json) : {};
    const theme = row.theme_json ? JSON.parse(row.theme_json) : {};
    const home = { title:'الرئيسية', blocks: (content.blocks||[]), theme };
    const brand = await getDefaultKit(req.ctx, null);
    const html = await renderHomePage({ home, brand });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }catch(e){
    res.status(500).send('SERVER_ERROR');
  }
});

router.get('/public/blog', async (req,res)=>{
  const website_id = await resolveWebsiteId(req.ctx, req);
  try{
    // list published posts from table (fast)
    let rows = null;
    if(website_id){
      rows = await req.ctx.db.select(
        `SELECT slug, title, excerpt FROM public_blog_posts
         WHERE org_id=? AND website_id=? AND status='published'
         ORDER BY id DESC LIMIT 50`,
        [req.ctx.org_id, website_id]
      );
    }else{
      rows = await req.ctx.db.select(
        `SELECT slug, title, excerpt FROM public_blog_posts
         WHERE org_id=? AND status='published'
         ORDER BY id DESC LIMIT 50`,
        [req.ctx.org_id]
      );
    }
    const brand = await getDefaultKit(req.ctx, null);
    const html = await renderBlogListPage({ items: rows||[], brand });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }catch(e){
    res.status(500).send('SERVER_ERROR');
  }
});

router.get('/public/blog/:slug', async (req,res)=>{
  const website_id = await resolveWebsiteId(req.ctx, req);
  const slug = String(req.params.slug||'').trim().toLowerCase();
  try{
    let row = null;
    if(website_id){
      row = await req.ctx.db.selectOne(
        `SELECT id, slug, title, content_json FROM public_blog_posts
         WHERE org_id=? AND website_id=? AND slug=? AND status='published' LIMIT 1`,
        [req.ctx.org_id, website_id, slug]
      );
    }else{
      row = await req.ctx.db.selectOne(
        `SELECT id, slug, title, content_json FROM public_blog_posts
         WHERE org_id=? AND slug=? AND status='published' LIMIT 1`,
        [req.ctx.org_id, slug]
      );
    }
    if(!row) return res.status(404).send('NOT_FOUND');
    const content = row.content_json ? JSON.parse(row.content_json) : {};
    const post = { title: row.title, content };
    const brand = await getDefaultKit(req.ctx, null);
    const html = await renderBlogPostPage({ post, brand });
    res.setHeader('content-type','text/html; charset=utf-8');
    res.send(html);
  }catch(e){
    res.status(500).send('SERVER_ERROR');
  }
});

module.exports = router;
