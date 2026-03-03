// Store Catalog Snapshots Repo (P3.5)
const { db } = require('../../../kernel/db/try_db');

function _id(prefix='snap'){ return prefix + '_' + Math.random().toString(36).slice(2, 12); }
function _now(){ return new Date().toISOString(); }

async function createSnapshot({ org_id, website_id=null, content_json, reason, created_by=null, doc_no=null, meta={} }){
  const id=_id('catsnap');
  const now=_now();
  if (db && typeof db.query === 'function') {
    await db.query(
      `INSERT INTO store_catalog_snapshots (id, org_id, website_id, content_json, reason, created_by, doc_no, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, org_id, website_id, JSON.stringify(content_json||{}), reason, created_by, doc_no, JSON.stringify(meta||{}), now]
    );
    return { id, created_at: now };
  }
  // no-db fallback: store in memory file is not available; return NOTE
  return { id, created_at: now, no_db: true };
}

async function listSnapshots({ org_id, website_id=null, limit=50 }){
  if (db && typeof db.query === 'function') {
    const rows = await db.query(
      `SELECT * FROM store_catalog_snapshots WHERE org_id=? AND (website_id IS ? OR website_id=?)
       ORDER BY created_at DESC LIMIT ?`,
      [org_id, website_id, website_id, limit]
    );
    return rows || [];
  }
  return [];
}

async function latestPublished({ org_id, website_id=null }){
  const rows = await listSnapshots({ org_id, website_id, limit: 1 });
  return rows && rows[0] ? rows[0] : null;
}

module.exports = { createSnapshot, listSnapshots, latestPublished };
