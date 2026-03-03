const express = require('express');
const router = express.Router();
const { publicGuard } = require('../../../kernel/public_guard.middleware');
const DB = require('../../shared/adapters/db.NOTE');
const { safeText } = require('../../../kernel/sanitize.NOTE');

router.get('/public/profile',
  publicGuard('public_profile', { abuseCategory:'public_profile' }),
  async (req,res)=>{
    const row = await DB.selectOne(req.ctx,
      `SELECT title, tagline, about_md, contact_json, socials_json, achievements_json, gallery_json, seo_json, status
       FROM public_branch_profiles WHERE website_id=? LIMIT 1`,
      [req.ctx.website_id]
    );
    if(!row || row.status!=='ACTIVE') return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    res.json({ ok:true, profile:{
      title: row.title, tagline: row.tagline, about_md: row.about_md,
      contact_json: JSON.parse(row.contact_json||'{}'),
      socials_json: JSON.parse(row.socials_json||'{}'),
      achievements_json: JSON.parse(row.achievements_json||'[]'),
      gallery_json: JSON.parse(row.gallery_json||'[]'),
      seo_json: JSON.parse(row.seo_json||'{}')
    }});
  }
);

router.get('/public/achievements',
  publicGuard('public_achievements', { abuseCategory:'public_achievements' }),
  async (req,res)=>{
    const rows = await DB.selectMany(req.ctx,
      `SELECT title, year, description, media_asset_id
       FROM public_branch_achievements
       WHERE website_id=? AND status='ACTIVE'
       ORDER BY sort_no ASC, updated_at DESC
       LIMIT 200`,
      [req.ctx.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.get('/public/blog',
  publicGuard('public_blog', { abuseCategory:'public_blog' }),
  async (req,res)=>{
    const rows = await DB.selectMany(req.ctx,
      `SELECT slug, title, excerpt, cover_asset_id, published_at
       FROM public_blog_posts
       WHERE website_id=? AND status='PUBLISHED'
       ORDER BY published_at DESC
       LIMIT 50`,
      [req.ctx.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.get('/public/blog/:slug',
  publicGuard('public_blog_post', { abuseCategory:'public_blog_post' }),
  async (req,res)=>{
    const slug = safeText(req.params.slug, 190);
    const row = await DB.selectOne(req.ctx,
      `SELECT slug, title, excerpt, content_md, cover_asset_id, seo_json, published_at, published_snapshot_id
       FROM public_blog_posts
       WHERE website_id=? AND slug=? AND status='PUBLISHED' LIMIT 1`,
      [req.ctx.website_id, slug]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    res.json({ ok:true, post:{
      slug: row.slug, title: row.title, excerpt: row.excerpt,
      content_md: row.content_md, cover_asset_id: row.cover_asset_id,
      seo_json: JSON.parse(row.seo_json||'{}'),
      published_at: row.published_at,
      snapshot_id: row.published_snapshot_id
    }});
  }
);

router.get('/public/home',
  publicGuard('public_home', { abuseCategory:'public_home' }),
  async (req,res)=>{
    // assumes public_websites table exists in your core
    const w = await DB.selectOne(req.ctx, `SELECT settings_json FROM public_websites WHERE id=? LIMIT 1`, [req.ctx.website_id]);
    const settings = JSON.parse(w?.settings_json || '{}');
    res.json({ ok:true, homepage: settings.homepage || { blocks: [] } });
  }
);

module.exports = router;
