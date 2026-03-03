// Adapter: GrapesJS <-> blocks/theme
// Strategy:
// - GrapesJS outputs HTML/CSS; we store a compiled snapshot in content_json.compiled_html
// - Also optionally keep blocks for our renderer where possible.
function grapesToStored({ html, css, componentsJson }){
  return {
    compiled_html: html||'',
    compiled_css: css||'',
    components_json: componentsJson||null
  };
}
module.exports = { grapesToStored };
