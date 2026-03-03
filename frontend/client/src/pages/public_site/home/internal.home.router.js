const express = require('express');
const router = express.Router();
router.use(requireModule('public_site'));
const { requireAuth, requireOrgScope, requirePerm } = require('../../kernel/internalGuards.NOTE');
const { validateBody } = require('../../kernel/validate.NOTE');
const { createSnapshot } = require('../blocks/services/snapshots.service');
const { getDefaultKit } = require('../brand/brand_kits.service');
const dms = require('../../dms/services/files.service');
const { attachCoreArtifact } = require('../../../kernel/artifacts/core_artifacts.service');
const { emit } = require('../../../kernel/events/emitter');

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
  await ctx.db.run(`CREATE TABLE IF NOT EXISTS public_home_pages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    org_id BIGINT NOT NULL,
    website_id BIGINT NULL,
    branch_id BIGINT NULL,
    title VARCHAR(160) NULL,
    blocks_json JSON NOT NULL,
    seo_json JSON NULL,
    theme_json JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    INDEX idx_home (org_id, website_id, branch_id, status)
  )`);
}

const UpsertSchema = {
  type:'object',
  additionalProperties:false,
  required:['reason','page'],
  properties:{
    reason:{ type:'string', minLength:2 },
    page:{
      type:'object',
      additionalProperties:false,
      required:['blocks'],
      properties:{
        id:{ type:['number','null'] },
        website_id:{ type:['number','null'] },
        branch_id:{ type:['number','null'] },
        title:{ type:'string' },
        blocks:{ type:'array' },
        seo:{ type:['object','null'], additionalProperties:true },
        theme:{ type:['object','null'], additionalProperties:true }
      }
    }
  }
};

router.post('/public_site/home/upsert',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'400kb' }),
  validateBody(UpsertSchema),
  async (req,res)=>{
    const { reason, page } = req.body;
    await ensure(req.ctx);
    if(page.id){
      await req.ctx.db.run(
        `UPDATE public_home_pages SET website_id=?, branch_id=?, title=?, blocks_json=?, seo_json=?, theme_json=?, updated_at=NOW()
         WHERE org_id=? AND id=?`,
        [page.website_id ?? null, page.branch_id ?? null, page.title||null, JSON.stringify({blocks:page.blocks||[]}),
         page.seo?JSON.stringify(page.seo):null, page.theme?JSON.stringify(page.theme):null, req.ctx.org_id, page.id]
      );
      await audit(req.ctx,{ action:'public_site.home.update', entity_type:'home_page', entity_id:page.id, reason, meta:{ website_id:page.website_id ?? null }});
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
res.json({ ok:true, id: page.id });
    }
    const r = await req.ctx.db.run(
      `INSERT INTO public_home_pages (org_id, website_id, branch_id, title, blocks_json, seo_json, theme_json)
       VALUES (?,?,?,?,?,?,?)`,
      [req.ctx.org_id, page.website_id ?? null, page.branch_id ?? null, page.title||null, JSON.stringify({blocks:page.blocks||[]}),
       page.seo?JSON.stringify(page.seo):null, page.theme?JSON.stringify(page.theme):null]
    );
    const id = (r && (r.insertId||r.lastID)) || null;
    await audit(req.ctx,{ action:'public_site.home.create', entity_type:'home_page', entity_id:id, reason, meta:{ website_id:page.website_id ?? null }});
    res.json({ ok:true, id });
  }
);

const PublishSchema = {
  type:'object',
  additionalProperties:false,
  required:['home_id','reason'],
  properties:{
    home_id:{ type:'number' },
    reason:{ type:'string', minLength:2 }
  }
};

router.post('/public_site/home/publish',
  requireAuth, requireOrgScope, requirePerm('public_site:pages:publish'),
  express.json({ limit:'60kb' }),
  validateBody(PublishSchema),
  async (req,res)=>{
    const { home_id, reason } = req.body;
    await ensure(req.ctx);
    const row = await req.ctx.db.selectOne(
      `SELECT id, website_id, branch_id, blocks_json, seo_json, theme_json FROM public_home_pages WHERE org_id=? AND id=? LIMIT 1`,
      [req.ctx.org_id, home_id]
    );
    if(!row) return res.status(404).json({ ok:false, error:'NOT_FOUND' });

    const last = await req.ctx.db.selectOne(
      `SELECT version_no FROM public_content_snapshots WHERE org_id=? AND entity_type='home' AND entity_id=? ORDER BY id DESC LIMIT 1`,
      [req.ctx.org_id, home_id]
    );
    const nextVer = (last && last.version_no ? Number(last.version_no)+1 : 1);

    const kit = await getDefaultKit(req.ctx, row.branch_id ?? null);
    const theme = row.theme_json ? JSON.parse(row.theme_json) : {};
    const mergedTheme = { ...(theme||{}), primary: theme.primary || kit.primary, secondary: theme.secondary || kit.secondary, font_family: theme.font_family || kit.font_family };

    const snap = await createSnapshot(req.ctx,{
      website_id: row.website_id||null,
      entity_type: 'home',
      entity_id: Number(home_id),
      version_no: nextVer,
      content_json: row.blocks_json ? JSON.parse(row.blocks_json) : null,
      seo_json: row.seo_json ? JSON.parse(row.seo_json) : null,
      visibility_json: null,
      theme_json: mergedTheme
    });
    // P2.3: Auto-NOTE published snapshot into DMS (service path: DMS)
    try {
      const payload = {
        website_id: row.website_id||null,
        branch_id: row.branch_id ?? null,
        entity_type: 'home',
        entity_id: Number(home_id),
        version_no: nextVer,
        doc_no: snap.doc_no,
        content_json: snap.content_json || null,
        theme_json: snap.theme_json || null,
        seo_json: snap.seo_json || null,
      };
      const f = await dms.createFileFromContent(req.ctx, {
        folder_key: 'publicsite_snapshots',
        folder_path: `PUBLICSITE/Websites/${row.website_id||'__none__'}/Snapshots/home`,
        filename: `${snap.doc_no}.json`,
        content: JSON.stringify(payload, null, 2),
        content_type: 'application/json',
        meta: { website_id: row.website_id||null, kind:'home', doc_no: snap.doc_no, version_no: nextVer, reason }
      });
      await attachCoreArtifact(req.ctx, {
        entity_type: 'publicsite_website',
        entity_id: String(row.website_id||'__none__'),
        artifact_type: 'report',
        source_module: 'dms',
        source_ref_id: f.id,
        dms_file_id: f.id,
        title: `Snapshot home ${snap.doc_no}`,
        meta: { kind:'home', doc_no: snap.doc_no, version_no: nextVer }
      });
      try { emit(req.app && req.app.get && req.app.get('bus'), 'publicsite.snapshot.published', { ..._env(req.ctx), entity:{ id: snap.doc_no, type:'publicsite_snapshot' }, data:{ website_id: String(row.website_id||''), kind:'home', doc_no: snap.doc_no, version_no: nextVer } }); } catch(e){}
    } catch(e) {}


    await req.ctx.db.run(`UPDATE public_home_pages SET status='published', updated_at=NOW() WHERE org_id=? AND id=?`, [req.ctx.org_id, home_id]);
    await audit(req.ctx,{ action:'public_site.home.publish', entity_type:'home_page', entity_id:home_id, reason, meta:{ doc_no:snap.doc_no, version_no: nextVer }});
    res.json({ ok:true, doc_no:snap.doc_no, version_no: nextVer });
  }
);

module.exports = router;
