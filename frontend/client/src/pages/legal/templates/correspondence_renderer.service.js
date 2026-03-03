// Legal correspondence renderer (P4.3)
const { render } = require('../../kernel/templates/simple_template');
const { toDataUrl } = require('../../kernel/qr/qr.service');
const { renderTemplate } = require('./render');

async function renderCorrespondenceHtml({ doc_no, subject, body_html, recipient_type, recipient_name, channel, public_url=null }){
  const qr_data = public_url ? await toDataUrl(public_url, { width: 200, margin: 1 }) : null;

  return render(`
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>مخاطبة {{doc_no}}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:24px;line-height:1.9;color:#111}
    .row{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}
    .card{border:1px solid #eee;border-radius:12px;padding:16px}
    .muted{color:#666}
    .h{margin:0 0 10px 0}
    .qr{width:200px;height:200px;border:1px solid #eee;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .qr img{width:200px;height:200px}
    .doc{margin-top:16px}
    .doc h3{margin:0 0 8px 0}
  </style>
</head>
<body>
  <div class="row">
    <div style="flex:1">
      <h2 class="h">مخاطبة قانونية</h2>
      <div class="muted">رقم المستند: <b>{{doc_no}}</b></div>
      <div class="muted">الجهة المخاطبة: <b>{{recipient_type}}</b> — {{recipient_name}}</div>
      <div class="muted">القناة: {{channel}}</div>
      <div class="muted">الموضوع: {{subject}}</div>
    </div>
    <div class="card" style="width:260px">
      <div class="muted">QR (رابط عام اختياري)</div>
      <div class="qr" style="margin-top:10px">
        {{#if qr_data}}
          <img src="{{qr_data}}" alt="QR"/>
        {{else}}
          <div class="muted">غير متاح</div>
        {{/if}}
      </div>
      <div class="muted" style="font-size:12px;margin-top:8px">{{public_url}}</div>
    </div>
  </div>

  <div class="card doc">
    <h3>{{subject}}</h3>
    <div>{{{body_html}}}</div>
  </div>
</body>
</html>
`, { doc_no, subject, body_html, recipient_type, recipient_name, channel, public_url: public_url||'', qr_data });
}

function renderFromTemplate({ template_html, data }){
  return renderTemplate(template_html, data || {});
}

module.exports = { renderCorrespondenceHtml, renderFromTemplate };
