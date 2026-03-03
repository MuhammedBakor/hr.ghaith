// Print Service: Branch Profile -> HTML (and later PDF in main platform)
// This bundle outputs HTML only; main repo can plug it into the central print pipeline.
const fs = require('fs');
const path = require('path');

function renderTemplate(tpl, data){
  // ultra-simple moustache-like replacement (no deps)
  let html = tpl;
  for(const [k,v] of Object.entries(data)){
    if(typeof v === 'string' || typeof v === 'number'){
      html = html.replaceAll('{{'+k+'}}', String(v));
    }
  }
  // remove simple conditionals placeholders (best-effort)
  html = html.replaceAll('{{#if logo_url}}','').replaceAll('{{/if}}','');
  html = html.replaceAll('{{#if qr_data_url}}','').replaceAll('{{/if}}','');
  // each images
  if(html.includes('{{#each images}}')){
    const part = html.split('{{#each images}}')[1].split('{{/each}}')[0];
    const images = Array.isArray(data.images) ? data.images : [];
    const rendered = images.map(img => part.replaceAll('{{this.url}}', img.url||'')).join('\n');
    html = html.replace('{{#each images}}'+part+'{{/each}}', rendered);
  }
  return html;
}

function profileToPrintModel({ snapshot, profile, brand }){
  const pj = profile || {};
  const about_html = (pj.about_html || pj.about || '').toString();
  const images = (pj.images || []).map(x => ({ url:x.url || x }));
  return {
    title: pj.title || pj.name || 'بروفايل الفرع',
    subtitle: pj.subtitle || '',
    branch_name: pj.branch_name || '',
    category: pj.category || '',
    city: pj.city || '',
    about_html,
    images,
    logo_url: brand?.logo_url || '',
    doc_no: snapshot.doc_no,
    version_no: snapshot.version_no,
    printed_at: new Date().toISOString(),
    verify_url: snapshot.verify_url || '',
    qr_data_url: snapshot.qr_data_url || ''
  };
}

async function renderProfileHtml(ctx, { snapshot, profile_json, brand_kit }){
  const tpl = fs.readFileSync(path.join(__dirname,'profile_print.template.html'), 'utf-8');
  const model = profileToPrintModel({ snapshot, profile: profile_json, brand: brand_kit });
  return renderTemplate(tpl, model);
}

module.exports = { renderProfileHtml, profileToPrintModel };
