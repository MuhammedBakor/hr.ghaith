import crypto from 'crypto';
import db from '../../models/database.js';

function now() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }

function get(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Minimal rule interpreter (safe, no eval):
 * Rule JSON format:
 * {
 *   "if": { ...expr... },
 *   "then": { "approve": true, "reason": "..." },
 *   "else": { "approve": false }
 * }
 *
 * Expr examples:
 * { "op":"and", "args":[ { "op":"eq", "left":{"var":"amount"}, "right": 100 }, ... ] }
 * { "op":"gt", "left":{"var":"amount"}, "right": 5000 }
 */
function evalExpr(expr, input) {
  if (!expr) return false;
  if (typeof expr === 'boolean') return expr;

  const op = expr.op;
  if (!op) return false;

  const val = (node) => {
    if (node && typeof node === 'object' && node.var) return get(input, node.var);
    return node;
  };

  switch (op) {
    case 'and': return Array.isArray(expr.args) && expr.args.every(e => evalExpr(e, input));
    case 'or': return Array.isArray(expr.args) && expr.args.some(e => evalExpr(e, input));
    case 'not': return !evalExpr(expr.arg, input);
    case 'eq': return val(expr.left) === val(expr.right);
    case 'ne': return val(expr.left) !== val(expr.right);
    case 'gt': return val(expr.left) > val(expr.right);
    case 'gte': return val(expr.left) >= val(expr.right);
    case 'lt': return val(expr.left) < val(expr.right);
    case 'lte': return val(expr.left) <= val(expr.right);
    case 'in': {
      const v = val(expr.left);
      const arr = val(expr.right);
      return Array.isArray(arr) ? arr.includes(v) : false;
    }
    default: return false;
  }
}

export function evaluateRule(ruleJson, input) {
  const cond = ruleJson?.if;
  const ok = evalExpr(cond, input || {});
  const out = ok ? (ruleJson?.then || {}) : (ruleJson?.else || {});
  return { matched: ok, output: out };
}

export function listRuleSets({ orgId, branchId, type=null }) {
  const rows = db.prepare(`
    SELECT * FROM rule_sets
    WHERE org_id=?
      AND (branch_id IS NULL OR branch_id=?)
      AND (? IS NULL OR type=?)
    ORDER BY key ASC
  `).all(String(orgId), branchId ? String(branchId) : null, type, type);
  return rows;
}

export function createRuleSet({ orgId, branchId, actorId, key, name, type='rule_set', initialRule, note }) {
  const id = uuid();
  db.prepare(`INSERT INTO rule_sets (id, org_id, branch_id, type, key, name, enabled, active_version_id, created_at, created_by)
              VALUES (?, ?, ?, ?, ?, 1, NULL, ?, ?)`)
    .run(id, String(orgId), branchId ? String(branchId) : null, String(type), String(key), String(name), now(), actorId);

  if (initialRule) {
    const v = createRuleVersion({ orgId, actorId, ruleSetId: id, jsonRule: initialRule, note: note || 'initial' });
    db.prepare(`UPDATE rule_sets SET active_version_id=?, updated_at=?, updated_by=? WHERE id=?`)
      .run(v.id, now(), actorId, id);
    return { id, active_version_id: v.id };
  }

  return { id };
}

export function createRuleVersion({ orgId, actorId, ruleSetId, jsonRule, note }) {
  const set = db.prepare(`SELECT * FROM rule_sets WHERE id=? AND org_id=?`).get(String(ruleSetId), String(orgId));
  if (!set) return { ok:false, error:'RULE_SET_NOT_FOUND' };

  const last = db.prepare(`SELECT MAX(version) as v FROM rule_versions WHERE rule_set_id=?`).get(String(ruleSetId));
  const nextVersion = Number(last?.v || 0) + 1;

  const id = uuid();
  db.prepare(`INSERT INTO rule_versions (id, rule_set_id, version, json_rule, created_at, created_by, note)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, String(ruleSetId), nextVersion, JSON.stringify(jsonRule), now(), actorId, note || null);

  // set active
  db.prepare(`UPDATE rule_sets SET active_version_id=?, updated_at=?, updated_by=? WHERE id=?`)
    .run(id, now(), actorId, String(ruleSetId));

  return { ok:true, id, version: nextVersion };
}

export function disableRuleSet({ orgId, actorId, ruleSetId }) {
  const set = db.prepare(`SELECT * FROM rule_sets WHERE id=? AND org_id=?`).get(String(ruleSetId), String(orgId));
  if (!set) return { ok:false, error:'RULE_SET_NOT_FOUND' };
  db.prepare(`UPDATE rule_sets SET enabled=0, updated_at=?, updated_by=? WHERE id=?`).run(now(), actorId, String(ruleSetId));
  return { ok:true };
}

export function runRuleTest({ orgId, branchId, actorId, ruleSetId, input, versionId }) {
  const set = db.prepare(`SELECT * FROM rule_sets WHERE id=? AND org_id=?`).get(String(ruleSetId), String(orgId));
  if (!set) return { ok:false, error:'RULE_SET_NOT_FOUND' };

  const vid = versionId || set.active_version_id;
  const ver = db.prepare(`SELECT * FROM rule_versions WHERE id=? AND rule_set_id=?`).get(String(vid), String(ruleSetId));
  if (!ver) return { ok:false, error:'RULE_VERSION_NOT_FOUND' };

  let ruleJson = {};
  try { ruleJson = JSON.parse(ver.json_rule); } catch { ruleJson = {}; }

  const result = evaluateRule(ruleJson, input || {});
  const id = uuid();

  db.prepare(`INSERT INTO rule_tests (id, org_id, branch_id, rule_set_id, version_id, input_json, result_json, created_at, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, String(orgId), branchId ? String(branchId) : null, String(ruleSetId), String(vid), JSON.stringify(input || {}), JSON.stringify(result), now(), actorId);

  return { ok:true, test_id: id, version: ver.version, result };
}


// ---------------- Policy Pack Templates (global library) ----------------
export function listPolicyPackTemplates() {
  return db.prepare(`SELECT id,key,name,version,created_at FROM policy_pack_templates ORDER BY key ASC, version DESC`).all();
}

export function getPolicyPackTemplate({ key, version }) {
  return db.prepare(`SELECT * FROM policy_pack_templates WHERE key=? AND version=?`).get(String(key), String(version));
}

export function upsertPolicyPackTemplate({ actorId, key, name, version, jsonPack }) {
  const existing = db.prepare(`SELECT id FROM policy_pack_templates WHERE key=? AND version=?`).get(String(key), String(version));
  const id = existing?.id || uuid();
  const createdAt = now();
  if (existing) {
    db.prepare(`UPDATE policy_pack_templates SET name=?, json_pack=? WHERE id=?`).run(String(name), JSON.stringify(jsonPack), String(id));
    return { ok:true, id, updated:true };
  }
  db.prepare(`INSERT INTO policy_pack_templates (id,key,name,version,json_pack,created_at) VALUES (?,?,?,?,?,?)`)
    .run(String(id), String(key), String(name), String(version), JSON.stringify(jsonPack), createdAt);
  return { ok:true, id, created:true };
}

export function applyPolicyPackTemplate({ orgId, branchId, actorId, templateKey, templateVersion, newKey, newName, note }) {
  const tmpl = getPolicyPackTemplate({ key: templateKey, version: templateVersion });
  if (!tmpl) return { ok:false, error:'TEMPLATE_NOT_FOUND' };
  let pack = {};
  try { pack = JSON.parse(tmpl.json_pack); } catch { pack = {}; }

  const key = newKey || tmpl.key;
  const name = newName || tmpl.name;

  const created = createRuleSet({
    orgId, branchId, actorId,
    type: 'policy_pack',
    key,
    name,
    initialRule: pack,
    note: note || `applied template ${tmpl.key}@${tmpl.version}`
  });
  return { ok:true, ...created, template: { key: tmpl.key, version: tmpl.version } };
}
