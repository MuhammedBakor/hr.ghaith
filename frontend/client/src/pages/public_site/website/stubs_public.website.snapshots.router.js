const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { qrSvg } = require('../utils/qr_min');

const { sanitizePublicHtml } = require('../utils/public_sanitize');
const { renderBlocks } = require('../../blocks/renderers/blocks.renderer');

function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

// Simple inline "QR-like" SVG placeholder (no deps). For production, replace with a real QR generator.
router.get('/public/snapshots/:doc_no', async (req,res)=>{
  // public read: doc_no only
  const row = await req.ctx.db.selectOne(
    `SELECT doc_no, version_no, hash_sha256, entity_type, entity_id, content_json, seo_json, created_at
     FROM public_content_snapshots WHERE doc_no=? LIMIT 1`,
    [req.params.doc_no]
  );
  if(!row) return res.status(404).send('Not Found');

  const content = row.content_json ? JSON.parse(row.content_json) : null;
  const renderedBlocks = (content && content.blocks) ? renderBlocks(content.blocks, 'anonymous') : '';
  const seo = row.seo_json ? JSON.parse(row.seo_json) : null;

  const body = `
  <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
    <div>${qrSvg(row.doc_no)}</div>
    <div>
      <div style="font-size:22px;font-weight:900">مستند منشور (Snapshot)</div>
      <div style="margin-top:6px;color:#6b7280">Doc No: <b>${esc(row.doc_no)}</b> — v${esc(row.version_no)}</div>
      <div style="margin-top:6px;color:#6b7280">Hash: <code>${esc(row.hash_sha256||'')}</code></div>
      <div style="margin-top:6px;color:#6b7280">Type: ${esc(row.entity_type)} / ID: ${esc(row.entity_id)}</div>
      <div style="margin-top:6px;color:#6b7280">Created: ${esc(row.created_at)}</div>
    </div>
  </div>
  <hr style="margin:18px 0;border:0;border-top:1px solid rgba(0,0,0,.08)"/>
  ${renderedBlocks ? (`<div>${renderedBlocks}</div><hr style="margin:18px 0;border:0;border-top:1px solid rgba(0,0,0,.08)"/>`) : ''}
  <pre style="white-space:pre-wrap;word-break:break-word;background:#0b1220;color:#e5e7eb;padding:14px;border-radius:12px">${esc(JSON.stringify({content_json:content, seo_json:seo},null,2))}</pre>
  `;

  const html = `
<!doctype html><html lang="ar" dir="rtl"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Snapshot ${esc(row.doc_no)}</title>
</head><body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; margin:18px; color:#0b1220">
${sanitizePublicHtml(body)}
</body></html>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
