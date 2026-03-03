const crypto = require('crypto');
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'); }
function docNo(prefix='DOC'){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  const rnd=Math.floor(Math.random()*90000)+10000;
  return `${prefix}-${y}${m}${day}-${rnd}`;
}

/**
 * createSnapshot(ctx, { content_type, content_id, version, snapshot_json, prefix })
 * In your kernel: persist to snapshots table + render QR + NOTE.
 */
async function createSnapshot(_ctx, { prefix }){
  return { id: uuid(), doc_no: docNo(prefix||'DOC') };
}
module.exports = { createSnapshot };
