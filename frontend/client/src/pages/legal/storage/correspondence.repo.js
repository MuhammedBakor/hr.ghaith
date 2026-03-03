// Legal correspondence repo (P4.3)
const { db } = require('../../kernel/db/try_db');

function _id(){ return 'lc_' + Math.random().toString(36).slice(2, 12); }
function _now(){ return new Date().toISOString(); }

async function create({ org_id, branch_id=null, case_id=null, doc_no=null, recipient_type, recipient_name=null, recipient_ref=null, channel='print', subject=null, public_ref=null, dms_file_id=null, meta={} }){
  const id=_id();
  const now=_now();
  if (db && typeof db.query === 'function') {
    await db.query(
      `INSERT INTO legal_correspondence (id, org_id, branch_id, case_id, doc_no, recipient_type, recipient_name, recipient_ref, channel, subject, public_ref, dms_file_id, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, org_id, branch_id||null, case_id||null, doc_no||null, recipient_type, recipient_name||null, recipient_ref||null, channel||'print', subject||null, public_ref||null, dms_file_id||null, JSON.stringify(meta||{}), now]
    );
  }
  return { id, created_at: now };
}

async function listByCase({ org_id, case_id, limit=200, offset=0 }){
  if (!db || typeof db.query !== 'function') return [];
  const rows = await db.query(`SELECT * FROM legal_correspondence WHERE org_id=? AND case_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?`, [org_id, case_id, Number(limit), Number(offset)]);
  return rows || [];
}

module.exports = { create, listByCase };
