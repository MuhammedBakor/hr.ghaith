
const express = require('express');
const router = express.Router();
const DB = require('../../shared/adapters/db.NOTE');
const { publicGuard } = require('../../../kernel/public_guard.middleware');
const { safeText } = require('../../../kernel/sanitize.NOTE');

router.get('/public/brand',
  publicGuard('public_brand', { abuseCategory:'public_brand' }),
  async (req,res)=>{
    const row = await DB.selectOne(req.ctx,
      `SELECT brand_json, tone_json FROM public_brand_settings WHERE website_id=? LIMIT 1`,
      [req.ctx.website_id]
    );
    res.json({ ok:true, brand: row ? JSON.parse(row.brand_json||'{}') : {}, tone: row ? JSON.parse(row.tone_json||'{}') : {} });
  }
);

router.get('/public/offers',
  publicGuard('public_offers', { abuseCategory:'public_offers' }),
  async (req,res)=>{
    const rows = await DB.selectMany(req.ctx,
      `SELECT id, title, description, price_amount, currency, media_asset_id, stock_ref
       FROM public_store_offers WHERE website_id=? AND status='ACTIVE'
       ORDER BY updated_at DESC LIMIT 50`,
      [req.ctx.website_id]
    );
    res.json({ ok:true, rows });
  }
);

router.get('/public/landing/:slug',
  publicGuard('public_landing', { abuseCategory:'public_landing' }),
  async (req,res)=>{
    const slug = safeText(req.params.slug, 190);
    const row = await DB.selectOne(req.ctx,
      `SELECT slug, title, blocks_json, seo_json, published_snapshot_id
       FROM public_landing_pages
       WHERE website_id=? AND slug=? AND status='PUBLISHED' LIMIT 1`,
      [req.ctx.website_id, slug]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    res.json({ ok:true, landing:{
      slug: row.slug,
      title: row.title,
      blocks: JSON.parse(row.blocks_json||'[]'),
      seo_json: JSON.parse(row.seo_json||'{}'),
      snapshot_id: row.published_snapshot_id
    }});
  }
);

module.exports = router;
