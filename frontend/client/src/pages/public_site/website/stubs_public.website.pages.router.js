
const express=require('express'); const router=express.Router();
const DB=require('../../shared/adapters/db.NOTE');
router.get('/public/pages/:slug', async(req,res)=>{
  const row=await DB.selectOne(req.ctx,
    `SELECT title,content_md,seo_json FROM public_pages WHERE website_id=? AND slug=? AND status='PUBLISHED'`,
    [req.ctx.website_id,req.params.slug]
  );
  if(!row) return res.status(404).json({ok:false});
  res.json({ok:true,page:row});
});
module.exports=router;