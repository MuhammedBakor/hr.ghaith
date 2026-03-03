// Print router (P1.6) — for internal use (authenticated)
const express = require('express');
const router = express.Router();
const requireCapability = require('../kernel/subscription/require_capability');
const { db } = require('../kernel/db/try_db');
const dmsSvc = require('../modules/dms/services/files.service');
const hrPayrollRepo = require('../modules/hr/repos/hr_payroll_runs.repo');
const { htmlToPdfBuffer } = require('../kernel/print/html_to_pdf.adapter');

router.get('/print/hr_letters/:doc_no.pdf', requireCapability('comms.hr_letters'), async (req, res) => {
  const ctx = req.ctx || {};
  const doc_no = req.params.doc_no;
  if (!db || typeof db.query !== 'function') {
    return res.status(501).json({ error:'db_not_configured' });
  }
  const rows = await db.query(`SELECT html FROM comms_letters WHERE org_id=? AND branch_id IS ? AND doc_no=? LIMIT 1`,
                              [ctx.org_id, ctx.branch_id || null, doc_no]);
  const row = (rows && rows[0]) || null;
  if (!row) return res.status(404).json({ error:'not_found' });

  try {
    const pdf = await htmlToPdfBuffer(row.html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc_no}.pdf"`);
    return res.send(pdf);
  } catch (e) {
    return res.status(501).json({ error: e.code || 'pdf_not_available', message: String(e.message || e) });
  }
});


router.get('/print/payroll_runs/:id.pdf', requireCapability('finance.payroll_lite'), async (req, res) => {
  const ctx = req.ctx || {};
  const id = req.params.id;
  const run = await hrPayrollRepo.getById({ org_id: ctx.org_id, id });
  if (!run) return res.status(404).json({ error:'not_found' });
  if (!run.dms_file_id) return res.status(409).json({ error:'no_dms_file' });

  const file = await dmsSvc.getFile(ctx, { id: run.dms_file_id });
  if (!file) return res.status(404).json({ error:'dms_not_found' });

  try {
    const pdf = await htmlToPdfBuffer(file.content.toString('utf-8'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="payroll_${id}.pdf"`);
    return res.send(pdf);
  } catch (e) {
    return res.status(501).json({ error: e.code || 'pdf_not_available', message: String(e.message || e) });
  }
});


router.get('/print/hr_letters/:doc_no.html', requireCapability('comms.hr_letters'), async (req, res) => {
  const ctx = req.ctx || {};
  const doc_no = req.params.doc_no;
  if (!db || typeof db.query !== 'function') return res.status(501).json({ error:'db_not_configured' });
  const rows = await db.query(`SELECT html FROM comms_letters WHERE org_id=? AND branch_id IS ? AND doc_no=? LIMIT 1`,
                              [ctx.org_id, ctx.branch_id || null, doc_no]);
  const row = (rows && rows[0]) || null;
  if (!row) return res.status(404).json({ error:'not_found' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(row.html);
});

module.exports = router;
