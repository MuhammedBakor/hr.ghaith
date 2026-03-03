function renderTemplate(html, data) {
  // Minimal safe binding: {{a.b}} replaced from data
  return html.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, path) => {
    const parts = path.split(".");
    let v = data;
    for (const p of parts) {
      if (v && Object.prototype.hasOwnProperty.call(v, p)) v = v[p];
      else { v = ""; break; }
    }
    if (v === null || v === undefined) return "";
    return String(v);
  });
}

module.exports = { renderTemplate };
