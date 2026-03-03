const express = require('express');
const router = express.Router();
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');

router.get('/public_site/media/list',
  requireAuth, requireOrgScope, requirePerm('public_site:media:read'),
  async (req,res)=>{
    try{
      const rows = await req.ctx.db.select(
        `SELECT id, sha256, mime, ext, size_bytes, filename, created_at
         FROM public_media_assets WHERE org_id=? ORDER BY id DESC LIMIT 100`,
        [req.ctx.org_id]
      );
      return res.json({ ok:true, items: rows });
    }catch(e){
      return res.json({ ok:true, items: [], note:'public_media_assets not available yet' });
    }
  }
);

module.exports = router;
