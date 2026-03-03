// Adapter: MJML -> HTML
// Backend can compile MJML server-side if mjml package installed in main repo.
// This bundle ships adapter + integration notes only.
function mjmlToStored({ mjml, html }){
  return { mjml: mjml||'', html: html||'' };
}
module.exports = { mjmlToStored };
