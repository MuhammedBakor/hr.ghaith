// Comms -> DMS adapter (P2.8)
// Store issued letter into DMS as a document, without coupling to DMS internals.
function _tryRequire(p){ try { return require(p); } catch(e) { return null; } }

const dmsService =
  _tryRequire('../../dms/services/files.service') ||
  _tryRequire('../../dms/services/dms.files.service') ||
  null;

async function storeHtmlAsDocument(ctx, { folder_key, folder_path, filename, html, meta }) {
  if (dmsService && typeof dmsService.createFileFromContent === 'function') {
    return dmsService.createFileFromContent(ctx, {
      folder_key,
      folder_path,
      filename,
      content: html,
      content_type: 'text/html',
      meta: meta || {}
    });
  }
  return { id: 'dms_' + Math.random().toString(36).slice(2,10), stored: false };
}

module.exports = { storeHtmlAsDocument };
