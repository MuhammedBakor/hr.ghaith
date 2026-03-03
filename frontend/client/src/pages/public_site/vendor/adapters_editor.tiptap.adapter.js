// Adapter: Tiptap <-> HTML/JSON
// Notes:
// - Prefer storing: { html, json } under content_json.rich_text
// - Renderer can output html with sanitization.
function tiptapToStored({ html, json }){
  return { html: html||'', json: json||null };
}
module.exports = { tiptapToStored };
