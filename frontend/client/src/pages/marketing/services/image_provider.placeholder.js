
const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }

function svgPlaceholder({ title='Ghaith', subtitle='Marketing', ratio='1:1' }){
  const w = ratio==='16:9' ? 1600 : (ratio==='9:16' ? 1080 : 1200);
  const h = ratio==='16:9' ? 900  : (ratio==='9:16' ? 1920 : 1200);
  const safe = (s)=>String(s||'').replace(/[<>&]/g,'');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="${Math.floor(h*0.06)}" fill="#ffffff">${safe(title)}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="${Math.floor(h*0.03)}" fill="#e5e7eb">${safe(subtitle)}</text>
</svg>`;
}

async function generateImage({ prompt, style_json }){
  const ratio = (style_json && style_json.ratio) || '1:1';
  // Minimal parsing: split title|subtitle if provided
  let title='Ghaith'; let subtitle='Marketing';
  if(prompt){
    const parts=String(prompt).split('|');
    title=parts[0].trim().slice(0,60) || title;
    subtitle=(parts[1]||'').trim().slice(0,80) || subtitle;
  }
  const svg = svgPlaceholder({ title, subtitle, ratio });
  const buf = Buffer.from(svg, 'utf-8');
  return { mime_type:'image/svg+xml', bytes:buf, file_name:`marketing_${uuid()}.svg` };
}

module.exports = { generateImage };
