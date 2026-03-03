const fs = require('fs');
const path = require('path');

function htmlEscape(s){
  return String(s||'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function render(tpl, data){
  let out = tpl;
  for(const [k,v] of Object.entries(data||{})){
    out = out.replaceAll('{{'+k+'}}', v===null||v===undefined ? '' : String(v));
  }
  return out;
}

function makeBtn(label, href, alt=false){
  return `<a class="btn ${alt?'alt':''}" href="${href}">${htmlEscape(label)}</a>`;
}

async function renderBranchProfilePage({ profile, brand }){
  const tpl = fs.readFileSync(path.join(__dirname,'templates','branch_profile.page.html'), 'utf-8');
  const theme = (profile.theme || {});
  const images = Array.isArray(profile.images) ? profile.images : [];
  const images_html = images.map(x=>{
    const url = (typeof x === 'string') ? x : (x.url||'');
    return url ? `<img src="${htmlEscape(url)}" alt="img"/>` : '';
  }).join('\n');

  const logo_img = brand?.logo_url ? `<img src="${htmlEscape(brand.logo_url)}" alt="logo"/>` : '';
  const whatsapp = profile.whatsapp || '';
  const phone = profile.phone || '';
  const email = profile.email || '';

  return render(tpl,{
    title: htmlEscape(profile.title || profile.name || 'الفرع'),
    subtitle: htmlEscape(profile.subtitle || ''),
    description: htmlEscape(profile.seo_description || ''),
    branch_name: htmlEscape(profile.branch_name || ''),
    category: htmlEscape(profile.category || ''),
    city: htmlEscape(profile.city || ''),
    about_html: (profile.about_html || htmlEscape(profile.about || '')).toString(),
    images_html,
    logo_img,
    primary: htmlEscape(theme.primary || brand?.primary || '#1D4ED8'),
    secondary: htmlEscape(theme.secondary || brand?.secondary || '#0B1220'),
    font_family: htmlEscape(theme.font_family || brand?.font_family || 'system-ui, -apple-system, Segoe UI, Roboto, Arial'),
    whatsapp_btn: whatsapp ? makeBtn('واتساب', `https://wa.me/${encodeURIComponent(whatsapp)}`) : '',
    call_btn: phone ? makeBtn('اتصال', `tel:${encodeURIComponent(phone)}`, true) : '',
    email_btn: email ? makeBtn('إيميل', `mailto:${encodeURIComponent(email)}`, true) : '',
    year: new Date().getFullYear()
  });
}

async function renderVerifyPage({ doc_no, status, snapshot }){
  const tpl = fs.readFileSync(path.join(__dirname,'templates','verify.page.html'), 'utf-8');
  const ok = status === 'ok';
  return render(tpl,{
    doc_no: htmlEscape(doc_no),
    status_class: ok ? 'ok' : 'bad',
    status_text: ok ? '✅ المستند صحيح ومسجل في النظام' : '❌ لم يتم العثور على المستند',
    entity_type: ok ? htmlEscape(snapshot.entity_type) : '-',
    version_no: ok ? htmlEscape(snapshot.version_no) : '-',
    created_at: ok ? htmlEscape(snapshot.created_at) : '-'
  });
}


async function renderHomePage({ home, brand }){
  // Minimal block renderer: supports hero, features, gallery, cta
  const theme = home.theme || {};
  const primary = theme.primary || brand?.primary || '#1D4ED8';
  const secondary = theme.secondary || brand?.secondary || '#0B1220';
  const font_family = theme.font_family || brand?.font_family || 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const blocks = (home.blocks||[]);
  const sections = blocks.map(b=>{
    const t = b.type || b.kind || '';
    const d = b.data || b.props || b;
    if(t === 'hero'){
      return `<section style="padding:44px 18px;background:linear-gradient(135deg,${secondary},#111);color:#fff">
        <div style="max-width:1100px;margin:0 auto">
          <h1 style="margin:0;font-size:28px">${htmlEscape(d.title||'')}</h1>
          <div style="margin-top:10px;opacity:.9;line-height:1.8">${htmlEscape(d.subtitle||'')}</div>
        </div>
      </section>`;
    }
    if(t === 'features'){
      const items = Array.isArray(d.items)?d.items:[];
      const cards = items.map(it=>`<div style="border:1px solid #eee;border-radius:16px;padding:14px">
        <div style="font-weight:800">${htmlEscape(it.title||'')}</div>
        <div style="margin-top:6px;color:#666;line-height:1.8">${htmlEscape(it.text||'')}</div>
      </div>`).join('');
      return `<section style="padding:22px 18px"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${cards}</div></section>`;
    }
    if(t === 'gallery'){
      const imgs = Array.isArray(d.images)?d.images:[];
      const g = imgs.map(u=>`<img src="${htmlEscape(typeof u==='string'?u:(u.url||''))}" style="width:100%;height:160px;object-fit:cover;border-radius:14px;border:1px solid #eee"/>`).join('');
      return `<section style="padding:22px 18px"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${g}</div></section>`;
    }

    if(t === 'store_services_cta'){
      const href = d.href || '/public/store/services';
      return `<section style="padding:30px 18px"><div style="max-width:1100px;margin:0 auto;border:1px solid #eee;border-radius:18px;padding:18px">
        <div style="font-weight:900;font-size:18px">${htmlEscape(d.title||'خدماتنا')}</div>
        <div style="margin-top:6px;color:#666;line-height:1.8">${htmlEscape(d.text||'تصفح الخدمات وأرسل طلبك مباشرة')}</div>
        <div style="margin-top:12px"><a href="${htmlEscape(href)}" style="display:inline-block;padding:10px 14px;border-radius:12px;border:1px solid ${htmlEscape(primary)};text-decoration:none;font-weight:800">عرض الخدمات</a></div>
      </div></section>`;
    }

    if(t === 'cta'){
      const btn = d.href ? `<a href="${htmlEscape(d.href)}" style="display:inline-block;background:${primary};color:#fff;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:800">${htmlEscape(d.button||'تواصل معنا')}</a>` : '';
      return `<section style="padding:30px 18px"><div style="max-width:1100px;margin:0 auto;border:1px solid #eee;border-radius:18px;padding:18px">
        <div style="font-weight:900;font-size:18px">${htmlEscape(d.title||'')}</div>
        <div style="margin-top:6px;color:#666;line-height:1.8">${htmlEscape(d.text||'')}</div>
        <div style="margin-top:12px">${btn}</div>
      </div></section>`;
    }
    return '';
  }).join('\n');

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${htmlEscape(home.title||'الرئيسية')}</title>
  <style>body{margin:0;font-family:${htmlEscape(font_family)};color:#111} a{color:${htmlEscape(primary)}}</style>
  </head><body>${sections}<footer style="padding:22px 18px;border-top:1px solid #eee;color:#666"><div style="max-width:1100px;margin:0 auto">© ${new Date().getFullYear()}</div></footer></body></html>`;
}

async function renderBlogListPage({ items, brand }){
  const primary = brand?.primary || '#1D4ED8';
  const font_family = brand?.font_family || 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const cards = (items||[]).map(p=>`<a href="/api/public/blog/${htmlEscape(p.slug)}" style="text-decoration:none;color:inherit">
    <div style="border:1px solid #eee;border-radius:16px;padding:14px">
      <div style="font-weight:900">${htmlEscape(p.title)}</div>
      <div style="margin-top:6px;color:#666;line-height:1.8">${htmlEscape(p.excerpt||'')}</div>
    </div>
  </a>`).join('');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>المدونة</title><style>body{margin:0;padding:24px;font-family:${htmlEscape(font_family)};background:#f6f7f9}
  .wrap{max-width:980px;margin:0 auto} .grid{display:grid;grid-template-columns:1fr;gap:12px} .top{margin-bottom:12px}
  .btn{display:inline-block;background:${htmlEscape(primary)};color:#fff;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:800}
  </style></head><body><div class="wrap"><div class="top"><h2 style="margin:0 0 8px 0">المدونة</h2></div><div class="grid">${cards}</div></div></body></html>`;
}

async function renderBlogPostPage({ post, brand }){
  const primary = brand?.primary || '#1D4ED8';
  const font_family = brand?.font_family || 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const content = post.content_md ? `<pre style="white-space:pre-wrap;line-height:1.9;margin:0">${htmlEscape(post.content_md)}</pre>` :
    `<pre style="white-space:pre-wrap;line-height:1.9;margin:0">${htmlEscape(JSON.stringify(post.content||{},null,2))}</pre>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${htmlEscape(post.title||'')}</title><style>body{margin:0;padding:24px;font-family:${htmlEscape(font_family)};background:#fff}
  .wrap{max-width:980px;margin:0 auto} a{color:${htmlEscape(primary)}}</style></head>
  <body><div class="wrap"><a href="/api/public/blog" style="text-decoration:none">← المدونة</a><h1 style="margin:10px 0 12px 0">${htmlEscape(post.title||'')}</h1>${content}</div></body></html>`;
}

module.exports = { renderBranchProfilePage, renderVerifyPage, renderHomePage, renderBlogListPage, renderBlogPostPage };
