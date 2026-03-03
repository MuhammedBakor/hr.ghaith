// Comms Letters Repository (P2.8)
const { db } = require('../../../kernel/db/try_db');

function _id() { return 'cl_' + Math.random().toString(36).slice(2, 12); }

async function insertLetter({ org_id, branch_id, doc_no, kind, template_key, leader_module, html, qr_data, meta }) {
  const id = _id();
  if (db && typeof db.query === 'function') {
    const sql = `INSERT INTO comms_letters (
        id, org_id, branch_id, doc_no, kind, template_key, leader_module,
        html, qr_data, meta_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.query(sql, [
      id, org_id, branch_id || null, doc_no, kind || 'letter', template_key, leader_module || 'hr',
      html || '', qr_data || null, JSON.stringify(meta || {}), new Date().toISOString()
    ]);
    return { id, stored: true };
  }
  return { id, stored: false };
}

async function getByDocNo({ org_id, doc_no }) {
  if (db && typeof db.query === 'function') {
    const rows = await db.query(
      `SELECT id, doc_no, template_key, leader_module, html, qr_data, meta_json, created_at
       FROM comms_letters WHERE org_id=? AND doc_no=? LIMIT 1`,
      [org_id, doc_no]
    );
    return rows && rows[0] ? rows[0] : null;
  }
  return null;
}

module.exports = { insertLetter, getByDocNo };
