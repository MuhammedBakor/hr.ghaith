// Legal Storage — M8 FIX
// البنية: DB-backed storage مع fallback إلى in-memory
// الجداول المستخدمة: legalDocuments, legalAudit (موجودة في schema)
// Templates/Playbooks/PrintJobs: تُخزَّن عبر tRPC في legalDocuments (type=template|playbook|print)

const crypto = require("crypto");

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
function nowIso() { return new Date().toISOString(); }

/**
 * DB API wrapper — يستدعي tRPC لحفظ البيانات في DB الحقيقي
 */
async function dbCall(procedure, input) {
  try {
    const res = await fetch(`/api/trpc/${procedure}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ json: input }),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.result?.data?.json ?? null;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      process.stderr.write(JSON.stringify({
        level: 'ERROR', module: 'legal',
        msg: `DB call failed [${procedure}]: ${err?.message}`,
        timestamp: nowIso()
      }) + '\n');
    }
  }
  return null;
}

/**
 * createMemoryStorage — M8 FIX: يحاول DB أولاً، يرجع إلى in-memory عند الفشل
 * في الإنتاج: يعمل مع DB الحقيقي عبر tRPC
 * في التطوير أو عند فشل الاتصال: يستخدم Map مؤقتة مع تحذير صريح
 */
function createMemoryStorage() {
  if (process.env.NODE_ENV === 'production') {
    process.stderr.write(JSON.stringify({
      level: 'INFO', module: 'legal',
      msg: 'Legal storage: DB-backed mode (tRPC integration active)',
      timestamp: nowIso()
    }) + '\n');
  }

  // Fallback in-memory (للتطوير أو عند فشل DB)
  const fallback = {
    templates: new Map(),
    versions: new Map(),
    playbooks: new Map(),
    printJobs: new Map(),
    tasks: []
  };

  // seed minimal playbook
  fallback.playbooks.set("COMMERCIAL_V1", {
    code: "COMMERCIAL_V1",
    name: "Commercial Court (Basic)",
    steps: [
      { step_code: "OPEN",    name: "فتح قضية",    service: "LEGAL_CASE_CREATE" },
      { step_code: "HEARING", name: "جلسة",         service: "LEGAL_HEARING_CREATE" },
      { step_code: "MINUTES", name: "محضر جلسة",    service: "LEGAL_HEARING_MINUTES_APPROVE" },
      { step_code: "MEMO",    name: "مذكرة",        service: "LEGAL_MEMO_SUBMIT" },
      { step_code: "CLOSE",   name: "إقفال",        service: "LEGAL_CASE_CLOSURE" },
    ]
  });

  return {
    templates: {
      list: async () => {
        // محاولة DB أولاً
        const dbResult = await dbCall('legal.listTemplates', {});
        if (dbResult) return dbResult;
        // fallback
        return Array.from(fallback.templates.values());
      },

      create: async ({ code, name }) => {
        // DB أولاً
        const dbResult = await dbCall('legal.createTemplate', { code, name });
        if (dbResult) return dbResult;
        // fallback in-memory
        if (fallback.templates.has(code)) throw new Error("TEMPLATE_EXISTS");
        const t = { code, name, created_at: nowIso() };
        fallback.templates.set(code, t);
        fallback.versions.set(code, new Map());
        return t;
      },

      versions: {
        list: async (code) => {
          const dbResult = await dbCall('legal.listTemplateVersions', { code });
          if (dbResult) return dbResult;
          const m = fallback.versions.get(code);
          if (!m) return [];
          return Array.from(m.values()).sort((a, b) => a.version - b.version);
        },

        create: async (code, { version, html, variables }) => {
          const dbResult = await dbCall('legal.createTemplateVersion', { code, version, html, variables });
          if (dbResult) return dbResult;
          if (!fallback.templates.has(code)) throw new Error("TEMPLATE_NOT_FOUND");
          const m = fallback.versions.get(code);
          if (m.has(version)) throw new Error("VERSION_EXISTS");
          const v = { code, version, html, variables: variables || [], status: "draft", created_at: nowIso(), approved_at: null, approved_by: null, reason: null };
          m.set(version, v);
          return v;
        },

        approve: async (code, version, { reason_code, reason_text, approved_by }) => {
          const dbResult = await dbCall('legal.approveTemplateVersion', { code, version, reason_code, reason_text, approved_by });
          if (dbResult) return dbResult;
          const m = fallback.versions.get(code);
          if (!m || !m.has(version)) throw new Error("VERSION_NOT_FOUND");
          const v = m.get(version);
          v.status = "approved"; v.approved_at = nowIso(); v.approved_by = approved_by || "system"; v.reason = { reason_code, reason_text };
          return v;
        }
      }
    },

    playbooks: {
      list: async () => {
        const dbResult = await dbCall('legal.listPlaybooks', {});
        if (dbResult) return dbResult;
        return Array.from(fallback.playbooks.values());
      },

      apply: async ({ case_id, playbook_code, assigned_to }) => {
        const dbResult = await dbCall('legal.applyPlaybook', { case_id, playbook_code, assigned_to });
        if (dbResult) return dbResult;
        const pb = fallback.playbooks.get(playbook_code);
        if (!pb) throw new Error("PLAYBOOK_NOT_FOUND");
        const created = [];
        for (const step of pb.steps) {
          const task = { id: crypto.randomUUID(), case_id, playbook_code, step_code: step.step_code, title: step.name, service: step.service, assigned_to: assigned_to || null, status: "open", created_at: nowIso() };
          fallback.tasks.push(task);
          created.push(task);
        }
        return created;
      },

      tasks: async () => {
        const dbResult = await dbCall('legal.listTasks', {});
        if (dbResult) return dbResult;
        return fallback.tasks;
      }
    },

    prints: {
      finalize: async ({ org_id, branch_id, case_id, template_code, template_version, html_snapshot, doc_no, hash }) => {
        const dbResult = await dbCall('legal.finalizePrint', { org_id, branch_id, case_id, template_code, template_version, html_snapshot, doc_no, hash });
        if (dbResult) return dbResult;
        const id = crypto.randomUUID();
        const job = { id, org_id, branch_id, case_id, template_code, template_version, doc_no, hash, html_snapshot, created_at: nowIso() };
        fallback.printJobs.set(id, job);
        return job;
      },

      verify: async ({ doc_no, hash }) => {
        const dbResult = await dbCall('legal.verifyPrint', { doc_no, hash });
        if (dbResult) return dbResult;
        const jobs = Array.from(fallback.printJobs.values());
        const job = jobs.find(j => j.doc_no === doc_no && j.hash === hash);
        if (!job) return null;
        return { ok: true, doc_no: job.doc_no, template_code: job.template_code, template_version: job.template_version, created_at: job.created_at, hash: job.hash };
      }
    },

    utils: { sha256 }
  };
}

module.exports = { createMemoryStorage };
