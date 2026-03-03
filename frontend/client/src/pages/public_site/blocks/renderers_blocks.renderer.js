function esc(s){ return String(s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

function renderHero(p){
  return `
  <section class="gh-card">
    <div class="gh-h" style="font-size:34px;font-weight:900;line-height:1.1">${esc(p.title)}</div>
    <p class="gh-muted" style="margin-top:10px;font-size:16px">${esc(p.subtitle||'')}</p>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
      <a class="gh-btn" href="${esc(p.primary_cta?.href||'#')}">${esc(p.primary_cta?.label||'ابدأ')}</a>
      ${p.secondary_cta?.label ? `<a class="gh-btn ghost" href="${esc(p.secondary_cta?.href||'#')}">${esc(p.secondary_cta?.label||'')}</a>`:''}
    </div>
  </section>`;
}

function renderServices(p){
  const items=(p.items||[]).map(it=>`
    <div class="gh-card">
      <div class="gh-h" style="font-weight:900">${esc(it.icon||'')} ${esc(it.title)}</div>
      <div class="gh-muted">${esc(it.desc||'')}</div>
    </div>`).join('');
  return `
  <section class="gh-card">
    <div class="gh-h" style="font-size:22px;font-weight:900">${esc(p.heading||'')}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px">${items}</div>
  </section>`;
}

function renderFeatures(p){
  const features=(p.features||[]).map(f=>`
    <div class="gh-card">
      <div class="gh-h" style="font-weight:900">${esc(f.title||'')}</div>
      <div class="gh-muted">${esc(f.desc||'')}</div>
    </div>`).join('');
  return `
  <section class="gh-card">
    <div class="gh-h" style="font-size:22px;font-weight:900">${esc(p.heading||'')}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:10px">${features}</div>
  </section>`;
}

function renderCTA(p){
  return `
  <section class="gh-card">
    <div class="gh-h" style="font-size:24px;font-weight:900">${esc(p.title||'')}</div>
    <div class="gh-muted" style="margin-top:8px">${esc(p.subtitle||'')}</div>
    <div style="margin-top:12px">
      <a class="gh-btn" href="${esc(p.button?.href||'#')}">${esc(p.button?.label||'تواصل')}</a>
    </div>
  </section>`;
}

function renderFAQ(p){
  const items=(p.items||[]).map(it=>`
    <details class="gh-card" style="margin-top:10px">
      <summary class="gh-h" style="font-weight:900;cursor:pointer">${esc(it.q||'')}</summary>
      <div class="gh-muted" style="margin-top:8px">${esc(it.a||'')}</div>
    </details>`).join('');
  return `
  <section class="gh-card">
    <div class="gh-h" style="font-size:22px;font-weight:900">${esc(p.heading||'')}</div>
    ${items}
  </section>`;
}

function isAllowed(block, audience){
  const v = block && block.visibility;
  if(!v || !Array.isArray(v.audiences)) return true;
  return v.audiences.includes(audience);
}

function renderBlocks(blocks, audience='anonymous'){
  let html='';
  for(const b of (blocks||[])){
    if(!isAllowed(b, audience)) continue;
    const p=b.props||{};
    if(b.code==='hero') html+=renderHero(p);
    else if(b.code==='services_grid') html+=renderServices(p);
    else if(b.code==='features_zigzag') html+=renderFeatures(p);
    else if(b.code==='cta') html+=renderCTA(p);
    else if(b.code==='faq') html+=renderFAQ(p);
    else html+=`<section class="gh-card"><div class="gh-muted">Unsupported block: ${esc(b.code)}</div></section>`;
  }
  return html;
}

module.exports = { renderBlocks };
