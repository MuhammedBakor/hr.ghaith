function themeCss(theme){
  const t = theme||{};
  const primary = t.primary || '#1D4ED8';
  const secondary = t.secondary || '#0B1220';
  const font = t.font_family || 'system-ui, -apple-system, Segoe UI, Roboto, Arial';
  return `
:root{
  --ps-primary:${primary};
  --ps-secondary:${secondary};
  --ps-font:${font};
}
body{ font-family: var(--ps-font); }
a, .ps-primary{ color: var(--ps-primary); }
.ps-btn{ background: var(--ps-primary); color:#fff; padding:10px 14px; border-radius:12px; display:inline-block; text-decoration:none; }
.ps-card{ border:1px solid rgba(0,0,0,.08); border-radius:14px; padding:14px; }
`;
}

module.exports = { themeCss };
