import db from '../../models/database.js';

function hasColumn(table, col) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
    return cols.includes(col);
  } catch {
    return false;
  }
}

export function initRulesTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS rule_sets (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      branch_id TEXT NULL,
      type TEXT NOT NULL DEFAULT 'rule_set',
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      active_version_id TEXT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NULL,
      updated_at TEXT NULL,
      updated_by TEXT NULL
    );
  `).run();

  // Backward-compatible upgrade (older DBs may miss "type")
  if (!hasColumn('rule_sets','type')) {
    try { db.prepare(`ALTER TABLE rule_sets ADD COLUMN type TEXT NOT NULL DEFAULT 'rule_set'`).run(); } catch {}
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS rule_versions (
      id TEXT PRIMARY KEY,
      rule_set_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      json_rule TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NULL,
      note TEXT NULL
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS rule_tests (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      branch_id TEXT NULL,
      rule_set_id TEXT NOT NULL,
      version_id TEXT NULL,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NULL
    );
  `).run();

  // Global library of policy packs (templates) that can be applied per org/branch.
  db.prepare(`
    CREATE TABLE IF NOT EXISTS policy_pack_templates (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      json_pack TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `).run();

  // Indexes
  try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS ux_rule_sets_scope_type_key ON rule_sets(org_id, COALESCE(branch_id,'_'), type, key);`).run(); } catch {}
  try { db.prepare(`CREATE INDEX IF NOT EXISTS idx_rule_versions_set_ver ON rule_versions(rule_set_id, version);`).run(); } catch {}
  try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS ux_policy_pack_templates_key_ver ON policy_pack_templates(key, version);`).run(); } catch {}
  // Seed default HR discipline policy pack template and apply per org (idempotent)
  try {
    db.prepare(`INSERT OR IGNORE INTO policy_pack_templates (id, key, name, version, json_pack, created_at)
      VALUES ('tpl_hr_discipline_sa_2024_v1','hr_discipline_sa_2024_v1','لائحة الجزاءات والانضباط (مبدئية)','1.0.0', ?, datetime('now'))`
    ).run("{\"meta\": {\"key\": \"hr_discipline_sa_2024_v1\", \"name\": \"\u0644\u0627\u0626\u062d\u0629 \u0627\u0644\u062c\u0632\u0627\u0621\u0627\u062a \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 (\u0645\u0628\u062f\u0626\u064a\u0629)\", \"version\": \"1.0.0\", \"locale\": \"ar-SA\"}, \"rules\": [{\"rule_id\": \"late_5_15\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 5, \"max_minutes\": 15}, \"severity\": \"low\", \"default_effect\": {\"action\": \"warning\", \"points\": 1}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"late_16_60\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 16, \"max_minutes\": 60}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"written_warning\", \"points\": 2}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"late_61_plus\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 61}, \"severity\": \"high\", \"default_effect\": {\"action\": \"deduction\", \"deduct_minutes\": 60, \"points\": 3}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"absence_1_day\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.absence\", \"days\": 1}, \"severity\": \"high\", \"default_effect\": {\"action\": \"deduction\", \"deduct_days\": 1, \"points\": 4}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"absence_2_plus\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.absence\", \"days\": 2}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 6}, \"override_allowed\": false, \"evidence_required\": true}, {\"rule_id\": \"early_leave\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.early_leave\", \"min_minutes\": 15}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"warning\", \"points\": 2}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"misconduct_minor\", \"category\": \"conduct\", \"trigger\": {\"type\": \"conduct.misconduct\", \"level\": \"minor\"}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"written_warning\", \"points\": 3}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"misconduct_major\", \"category\": \"conduct\", \"trigger\": {\"type\": \"conduct.misconduct\", \"level\": \"major\"}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 8}, \"override_allowed\": false, \"evidence_required\": true}, {\"rule_id\": \"safety_violation\", \"category\": \"safety\", \"trigger\": {\"type\": \"safety.violation\"}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 8}, \"override_allowed\": false, \"evidence_required\": true}]}");
  } catch {}

  // Seed cross-module smart ops packs (idempotent). These are *templates* that orgs can enable.
  try {
    db.prepare(`INSERT OR IGNORE INTO policy_pack_templates (id, key, name, version, json_pack, created_at)
      VALUES ('tpl_platform_smart_ops_v1','platform_smart_ops_v1','منصة الأتمتة الذكية (سيناريوهات متعددة)','1.0.0', ?, datetime('now'))`
    ).run(JSON.stringify({
      meta: { key: 'platform_smart_ops_v1', name: 'منصة الأتمتة الذكية (سيناريوهات متعددة)', version: '1.0.0', locale: 'ar-SA' },
      rules: [
        { rule_id: 'maint_whatsapp_create_workorder', category: 'maintenance', trigger: { type: 'comms.message', channel: 'whatsapp', contains_any: ['بلاغ','صيانة'] }, severity: 'medium', default_effect: { action: 'create_workorder', module: 'maintenance' }, override_allowed: true, evidence_required: false },
        { rule_id: 'finance_auto_invoice_on_approval', category: 'finance', trigger: { type: 'workflow.step.approved', key: 'finance.invoice.issue' }, severity: 'high', default_effect: { action: 'issue_invoice', module: 'finance' }, override_allowed: true, evidence_required: true },
        { rule_id: 'legal_hearing_notify', category: 'legal', trigger: { type: 'legal.hearing.scheduled' }, severity: 'high', default_effect: { action: 'notify_parties', channels: ['whatsapp','email'] }, override_allowed: true, evidence_required: false },
        { rule_id: 'hr_punctuality_nudge', category: 'hr', trigger: { type: 'attendance.punctuality', mode: 'early' }, severity: 'low', default_effect: { action: 'notify', template: 'hr.punctuality.early' }, override_allowed: true, evidence_required: false },
        { rule_id: 'hr_late_warning', category: 'hr', trigger: { type: 'attendance.punctuality', mode: 'late' }, severity: 'medium', default_effect: { action: 'notify_and_open_ack', template: 'hr.punctuality.late' }, override_allowed: true, evidence_required: false }
      ]
    }));
  } catch {}

  try {
    const orgs = db.prepare(`SELECT id FROM organizations`).all();
    for (const o of orgs) {
      const orgId = o.id;
      const branches = db.prepare(`SELECT id FROM branches WHERE org_id=?`).all(orgId);
      const scopeBranchId = (branches[0]?.id) || null;

      // Create rule_set (policy_pack) at org scope
      const existing = db.prepare(`SELECT * FROM rule_sets WHERE org_id=? AND branch_id IS NULL AND type='policy_pack' AND key=?`).get(orgId, 'hr_discipline_sa_2024_v1');
      if (!existing) {
        const rsId = `pp_${orgId}_hr_discipline_sa_2024_v1`;
        const verId = `ppv_${orgId}_1`;
        db.prepare(`INSERT INTO rule_sets (id, org_id, branch_id, type, key, name, enabled, active_version_id, created_at)
          VALUES (?,?,?,?,?,?,1,?, datetime('now'))`
        ).run(rsId, orgId, null, 'policy_pack', 'hr_discipline_sa_2024_v1', 'لائحة الجزاءات والانضباط (مبدئية)', verId);

        db.prepare(`INSERT INTO rule_versions (id, rule_set_id, version, json_rule, created_at, note)
          VALUES (?,?,?,?, datetime('now'), ?)`
        ).run(verId, rsId, 1, "{\"meta\": {\"key\": \"hr_discipline_sa_2024_v1\", \"name\": \"\u0644\u0627\u0626\u062d\u0629 \u0627\u0644\u062c\u0632\u0627\u0621\u0627\u062a \u0648\u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 (\u0645\u0628\u062f\u0626\u064a\u0629)\", \"version\": \"1.0.0\", \"locale\": \"ar-SA\"}, \"rules\": [{\"rule_id\": \"late_5_15\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 5, \"max_minutes\": 15}, \"severity\": \"low\", \"default_effect\": {\"action\": \"warning\", \"points\": 1}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"late_16_60\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 16, \"max_minutes\": 60}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"written_warning\", \"points\": 2}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"late_61_plus\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.late\", \"min_minutes\": 61}, \"severity\": \"high\", \"default_effect\": {\"action\": \"deduction\", \"deduct_minutes\": 60, \"points\": 3}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"absence_1_day\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.absence\", \"days\": 1}, \"severity\": \"high\", \"default_effect\": {\"action\": \"deduction\", \"deduct_days\": 1, \"points\": 4}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"absence_2_plus\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.absence\", \"days\": 2}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 6}, \"override_allowed\": false, \"evidence_required\": true}, {\"rule_id\": \"early_leave\", \"category\": \"attendance\", \"trigger\": {\"type\": \"attendance.early_leave\", \"min_minutes\": 15}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"warning\", \"points\": 2}, \"override_allowed\": true, \"evidence_required\": false}, {\"rule_id\": \"misconduct_minor\", \"category\": \"conduct\", \"trigger\": {\"type\": \"conduct.misconduct\", \"level\": \"minor\"}, \"severity\": \"medium\", \"default_effect\": {\"action\": \"written_warning\", \"points\": 3}, \"override_allowed\": true, \"evidence_required\": true}, {\"rule_id\": \"misconduct_major\", \"category\": \"conduct\", \"trigger\": {\"type\": \"conduct.misconduct\", \"level\": \"major\"}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 8}, \"override_allowed\": false, \"evidence_required\": true}, {\"rule_id\": \"safety_violation\", \"category\": \"safety\", \"trigger\": {\"type\": \"safety.violation\"}, \"severity\": \"critical\", \"default_effect\": {\"action\": \"investigation\", \"points\": 8}, \"override_allowed\": false, \"evidence_required\": true}]}", 'seeded');

        // Set as default for HR discipline engine via org override
        try {
          db.prepare(`INSERT OR REPLACE INTO settings_overrides (key, scope, scope_id, value, type, updated_at)
            VALUES ('hr.discipline.policy_pack_id','org',?,?, 'string', CURRENT_TIMESTAMP)`
          ).run(orgId, rsId);
        } catch {}
      }
    }
  } catch {}
}