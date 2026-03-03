const express = require("express");
const { renderTemplate } = require("./templates/render");

function requireFields(obj, fields) {
  const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length) {
    const err = new Error("MISSING_FIELDS");
    err.details = missing;
    throw err;
  }
}

function buildLegalRouter({ storage, adapters }) {
  const r = express.Router();

  r.get("/health", (req, res) => res.json({ ok: true, module: "legal", version: "1.6.3" }));

  // Templates
  r.get("/templates", adapters.rbac.requirePerm("legal:templates:view"), async (req, res) => {
    res.json({ items: await storage.templates.list() });
  });

  r.post("/templates", adapters.rbac.requirePerm("legal:templates:admin"), async (req, res) => {
    try {
      requireFields(req.body, ["code", "name"]);
      const t = await storage.templates.create({ code: req.body.code, name: req.body.name });
      res.status(201).json(t);
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  r.get("/templates/:code/versions", adapters.rbac.requirePerm("legal:templates:view"), async (req, res) => {
    res.json({ items: await storage.templates.versions.list(req.params.code) });
  });

  r.post("/templates/:code/versions", adapters.rbac.requirePerm("legal:templates:admin"), async (req, res) => {
    try {
      requireFields(req.body, ["version", "html"]);
      const v = await storage.templates.versions.create(req.params.code, {
        version: Number(req.body.version),
        html: String(req.body.html),
        variables: Array.isArray(req.body.variables) ? req.body.variables : []
      });
      res.status(201).json(v);
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  r.post("/templates/:code/versions/:version/approve", adapters.rbac.requirePerm("legal:templates:admin"), async (req, res) => {
    try {
      requireFields(req.body, ["reason_code", "reason_text"]);
      const v = await storage.templates.versions.approve(req.params.code, Number(req.params.version), {
        reason_code: req.body.reason_code,
        reason_text: req.body.reason_text,
        approved_by: req.body.approved_by || "user"
      });
      await adapters.audit.log({ action: "legal.template.approved", code: req.params.code, version: Number(req.params.version) });
      res.json(v);
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  r.post("/templates/:code/render", adapters.rbac.requirePerm("legal:templates:view"), async (req, res) => {
    try {
      requireFields(req.body, ["version", "data"]);
      const versions = await storage.templates.versions.list(req.params.code);
      const v = versions.find(x => x.version === Number(req.body.version));
      if (!v) return res.status(404).json({ error: "VERSION_NOT_FOUND" });
      const html = renderTemplate(v.html, req.body.data || {});
      res.json({ html });
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  // Playbooks
  r.get("/playbooks", adapters.rbac.requirePerm("legal:playbooks:view"), async (req, res) => {
    res.json({ items: await storage.playbooks.list() });
  });

  r.post("/playbooks/apply", adapters.rbac.requirePerm("legal:playbooks:apply"), async (req, res) => {
    try {
      requireFields(req.body, ["case_id", "playbook_code"]);
      const tasks = await storage.playbooks.apply({
        case_id: req.body.case_id,
        playbook_code: req.body.playbook_code,
        assigned_to: req.body.assigned_to || null
      });
      await adapters.audit.log({ action: "legal.playbook.applied", playbook_code: req.body.playbook_code, case_id: req.body.case_id });
      res.status(201).json({ items: tasks });
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  r.get("/playbooks/tasks", adapters.rbac.requirePerm("legal:tasks:view"), async (req, res) => {
    res.json({ items: await storage.playbooks.tasks() });
  });

  // Prints
  r.post("/prints/finalize", adapters.rbac.requirePerm("legal:prints:finalize"), async (req, res) => {
    try {
      requireFields(req.body, ["org_id", "branch_id", "case_id", "template_code", "template_version", "html_snapshot", "reason_code", "reason_text"]);
      // ensure template version is approved
      const versions = await storage.templates.versions.list(req.body.template_code);
      const v = versions.find(x => x.version === Number(req.body.template_version));
      if (!v) return res.status(404).json({ error: "TEMPLATE_VERSION_NOT_FOUND" });
      if (v.status !== "approved") return res.status(409).json({ error: "TEMPLATE_VERSION_NOT_APPROVED" });

      const year = String(new Date().getFullYear());
      const doc_no = await adapters.counters.next({
        key: "legal.doc_no",
        org_id: req.body.org_id,
        branch_id: req.body.branch_id,
        year,
        prefix: "LGL"
      });

      const hash = storage.utils.sha256(`${doc_no}|${req.body.html_snapshot}`);
      const job = await storage.prints.finalize({
        org_id: req.body.org_id,
        branch_id: req.body.branch_id,
        case_id: req.body.case_id,
        template_code: req.body.template_code,
        template_version: Number(req.body.template_version),
        html_snapshot: String(req.body.html_snapshot),
        doc_no,
        hash
      });
      await adapters.audit.log({
        action: "legal.print.finalized",
        doc_no,
        case_id: req.body.case_id,
        reason: { reason_code: req.body.reason_code, reason_text: req.body.reason_text }
      });
      res.status(201).json({ id: job.id, doc_no: job.doc_no, hash: job.hash, created_at: job.created_at });
    } catch (e) {
      res.status(400).json({ error: e.message, details: e.details || null });
    }
  });

  r.get("/prints/verify", async (req, res) => {
    const doc_no = req.query.doc_no;
    const hash = req.query.hash;
    if (!doc_no || !hash) return res.status(400).json({ error: "MISSING_QUERY", details: ["doc_no","hash"] });
    const meta = await storage.prints.verify({ doc_no, hash });
    if (!meta) return res.status(404).json({ ok: false });
    return res.json(meta);
  });

  return r;
}

module.exports = { buildLegalRouter };
