// Store Catalog Repo (P3.4)
const { db } = require('../../../kernel/db/try_db');

function _id(prefix='cat'){ return prefix + '_' + Math.random().toString(36).slice(2, 12); }
function _now(){ return new Date().toISOString(); }

const mem = new Map(); // key: org_id:id -> row

function _k(org_id, id){ return `${org_id}:${id}`; }

async function upsert({ org_id, website_id=null, sku, name, description, price, currency='SAR', is_active=1, meta={} }){
  const now=_now();

  if (db && typeof db.query === 'function') {
    const rows = await db.query(
      `SELECT id FROM store_catalog_items
       WHERE org_id=? AND sku=? AND (website_id IS ? OR website_id=?)
       LIMIT 1`,
      [org_id, sku, website_id, website_id]
    );
    const existing = rows && rows[0] ? rows[0].id : null;

    if (existing) {
      await db.query(
        `UPDATE store_catalog_items
         SET website_id=?, name=?, description=?, price=?, currency=?, is_active=?, meta_json=?, updated_at=?
         WHERE org_id=? AND id=?`,
        [website_id, name, description||null, Number(price||0), currency, Number(is_active||0), JSON.stringify(meta||{}), now, org_id, existing]
      );
      return { id: existing, updated: true };
    }

    const id=_id('cat');
    await db.query(
      `INSERT INTO store_catalog_items
       (id, org_id, website_id, sku, name, description, price, currency, is_active, meta_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, org_id, website_id, sku, name, description||null, Number(price||0), currency, Number(is_active||0), JSON.stringify(meta||{}), now, now]
    );
    return { id, created: true };
  }

  // in-memory fallback
  let existing = null;
  for (const row of mem.values()) {
    if (row.org_id === org_id && row.sku === sku && (row.website_id || null) === (website_id || null)) { existing = row; break; }
  }
  if (existing) {
    existing.website_id = website_id || null;
    existing.name = name;
    existing.description = description || null;
    existing.price = Number(price||0);
    existing.currency = currency;
    existing.is_active = Number(is_active||0);
    existing.meta_json = JSON.stringify(meta||{});
    existing.updated_at = now;
    return { id: existing.id, updated: true };
  }
  const id=_id('cat');
  const row = { id, org_id, website_id: website_id||null, sku, name, description: description||null, price:Number(price||0), currency, is_active:Number(is_active||0), meta_json: JSON.stringify(meta||{}), created_at: now, updated_at: now };
  mem.set(_k(org_id,id), row);
  return { id, created: true };
}

async function list({ org_id, website_id=null, only_active=false, limit=50, offset=0 }) {
  if (db && typeof db.query === 'function') {
    const where = ['org_id=?'];
    const params = [org_id];
    if (website_id !== null && website_id !== undefined) { where.push('(website_id IS ? OR website_id=?)'); params.push(website_id, website_id); }
    if (only_active) { where.push('is_active=1'); }
    const sql = `SELECT * FROM store_catalog_items WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const rows = await db.query(sql, params);
    return rows || [];
  }

  const rows = Array.from(mem.values()).filter(r=>r.org_id===org_id);
  const filtered = rows.filter(r=>{
    const okWebsite = (website_id===null || website_id===undefined) ? true : ((r.website_id||null)===(website_id||null));
    const okActive = only_active ? Number(r.is_active||0)===1 : true;
    return okWebsite && okActive;
  });
  return filtered.slice(offset, offset+limit);
}

async function getBySku({ org_id, website_id=null, sku }) {
  const rows = await list({ org_id, website_id, only_active:false, limit:9999, offset:0 });
  return rows.find(r=>String(r.sku).toUpperCase()===String(sku).toUpperCase()) || null;
}

module.exports = { upsert, list, getBySku };
