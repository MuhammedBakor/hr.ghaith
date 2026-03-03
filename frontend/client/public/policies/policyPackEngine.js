// Policy Pack Engine (Disciplinary / Attendance / etc.)
// A "policy pack" is a rule_set with type='policy_pack' whose json_rule contains:
// { meta:{...}, rules:[ { rule_id, category, trigger, recommended_services, severity, default_effect, override_allowed, evidence_required } ] }

function asNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function matchTrigger(trigger, input) {
  if (!trigger || typeof trigger !== 'object') return false;

  // Generic: trigger.event must match input.event if provided
  if (trigger.event && String(trigger.event) !== String(input.event || '')) return false;

  // Attendance late
  if (trigger.type === 'attendance.late') {
    const mins = asNumber(input.minutes_late);
    if (mins == null) return false;
    const min = asNumber(trigger.minutes_min) ?? 0;
    const max = asNumber(trigger.minutes_max);
    if (mins < min) return false;
    if (max != null && mins > max) return false;

    if (typeof trigger.affects_others === 'boolean') {
      if (Boolean(input.affects_others) !== trigger.affects_others) return false;
    }
    return true;
  }

  // Attendance absence
  if (trigger.type === 'attendance.absence') {
    const days = asNumber(input.days_absent);
    if (days == null) return false;
    const min = asNumber(trigger.days_min) ?? 1;
    const max = asNumber(trigger.days_max);
    if (days < min) return false;
    if (max != null && days > max) return false;
    return true;
  }

  // Default: basic key/value matching
  for (const [k,v] of Object.entries(trigger)) {
    if (k === 'type' || k === 'event') continue;
    if (v == null) continue;
    if (String(input[k]) !== String(v)) return false;
  }
  return true;
}

function normalizeSeverity(sev) {
  const s = String(sev || 'medium').toLowerCase();
  if (['low','medium','high','critical'].includes(s)) return s;
  return 'medium';
}

const severityRank = { low: 10, medium: 20, high: 30, critical: 40 };

export function evaluatePolicyPack(packJson, input) {
  const rules = Array.isArray(packJson?.rules) ? packJson.rules : [];
  const matched = [];

  for (const r of rules) {
    const ok = matchTrigger(r.trigger || {}, input || {});
    if (!ok) continue;

    matched.push({
      rule_id: r.rule_id,
      category: r.category || null,
      severity: normalizeSeverity(r.severity),
      recommended_services: Array.isArray(r.recommended_services) ? r.recommended_services : [],
      default_effect: r.default_effect ?? null,
      override_allowed: r.override_allowed !== false,
      evidence_required: r.evidence_required ?? null,
      penalty_matrix: r.penalty_matrix ?? null,
      notes: r.notes ?? null
    });
  }

  matched.sort((a,b)=> (severityRank[a.severity]||0) - (severityRank[b.severity]||0));
  return { ok:true, matched, count: matched.length };
}
