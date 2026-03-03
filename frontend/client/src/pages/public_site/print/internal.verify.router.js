const express = require('express');
const router = express.Router();

// Public verify endpoint (read-only): /public/verify/:doc_no
// NOTE: In main platform, add rate-limit + caching + strict projection.
router.get('/public/verify/:doc_no', async (req,res)=>{
  const doc_no = String(req.params.doc_no || '').trim();
  if(!doc_no) return res.status(400).json({ ok:false, error:'BAD_DOC_NO' });
  try{
    const row = await req.ctx.db.selectOne(
      `SELECT doc_no, entity_type, entity_id, version_no, created_at
       FROM public_content_snapshots WHERE org_id=? AND doc_no=? LIMIT 1`,
      [req.ctx.org_id, doc_no]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    res.json({ ok:true, snapshot: row });
  }catch(e){
    res.status(500).json({ ok:false, error:'SERVER_ERROR' });
  }
});

module.exports = router;
