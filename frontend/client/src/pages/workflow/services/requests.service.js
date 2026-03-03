// Workflow Requests Service (P3.6)
const { db } = require('../../../kernel/db/try_db');
const { notify } = require('../../../kernel/notifications/notifier');

const financeIntents = require('../../finance/repos/finance_intents.repo');
const financeInvoices = require('../../finance/repos/finance_invoices.repo');
const opsTasks = require('../../operations/repos/ops_tasks.repo');
const { attachCoreArtifact } = require('../../../kernel/artifacts/core_artifacts.service');
const dms = require('../../dms/services/files.service');
const { render } = require('../../../kernel/templates/simple_template');
const { nextDocNoAsync } = require('../../../kernel/comms/doc_numbers.service');


function _id(prefix='wr'){ return prefix + '_' + Math.random().toString(36).slice(2, 12); }
function _now(){ return new Date().toISOString(); }

async function ensureTables(ctx){
  // Best effort. If ctx.db.run exists, create; otherwise rely on external migrations.
  if (ctx && ctx.db && typeof ctx.db.run === 'function') {
    await ctx.db.run(`CREATE TABLE IF NOT EXISTS workflow_requests (
      id VARCHAR(64) PRIMARY KEY,
      org_id VARCHAR(64) NOT NULL,
      branch_id INTEGER NULL,
      module_key VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payload_json TEXT NULL,
      reason TEXT NOT NULL,
      created_by VARCHAR(64) NULL,
      assigned_role VARCHAR(128) NULL,
      assigned_user VARCHAR(64) NULL,
      decision VARCHAR(20) NULL,
      decision_reason TEXT NULL,
      decided_by VARCHAR(64) NULL,
      decided_at VARCHAR(64) NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )`);
  }
}

async function createRequest(ctx, { org_id, branch_id=null, title, payload, reason, module_key='generic', assigned_role=null, assigned_user=null }){
  await ensureTables(ctx);
  const id=_id('wr');
  const now=_now();
  const row = {
    id, org_id, branch_id: branch_id||null, module_key,
    title: String(title||''),
    status: 'pending',
    payload_json: payload ? JSON.stringify(payload) : null,
    reason: String(reason||''),
    created_by: ctx.actor_id || ctx.user_id || null,
    assigned_role: assigned_role||null,
    assigned_user: assigned_user||null,
    decision: null, decision_reason: null, decided_by: null, decided_at: null,
    created_at: now, updated_at: now
  };

  if (ctx && ctx.db && typeof ctx.db.run === 'function') {
    await ctx.db.run(
      `INSERT INTO workflow_requests
       (id, org_id, branch_id, module_key, title, status, payload_json, reason, created_by, assigned_role, assigned_user, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [row.id, row.org_id, row.branch_id, row.module_key, row.title, row.status, row.payload_json, row.reason, row.created_by, row.assigned_role, row.assigned_user, row.created_at, row.updated_at]
    );
  }

  // Notify best-effort
  try{
    await notify(ctx, {
      channel: 'internal',
      to: row.assigned_user || row.assigned_role || 'store.team',
      subject: `طلب جديد: ${row.title}`,
      message: `تم إنشاء طلب موافقة (${row.id}) للفرع: ${row.branch_id||'-'}`,
      meta: { request_id: row.id, module_key: row.module_key, branch_id: row.branch_id, payload: payload||{} }
    });
  }catch(e){}

  return { id: row.id, status: row.status };
}

async function listRequests(ctx, { org_id, branch_id=null, status=null, limit=50 }){
  await ensureTables(ctx);
  if (ctx && ctx.db && typeof ctx.db.query === 'function') {
    const where = ['org_id=?'];
    const params=[org_id];
    if (branch_id !== null && branch_id !== undefined) { where.push('(branch_id IS ? OR branch_id=?)'); params.push(branch_id, branch_id); }
    if (status) { where.push('status=?'); params.push(status); }
    const rows = await ctx.db.query(`SELECT * FROM workflow_requests WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`, [...params, limit]);
    return rows || [];
  }
  return [];
}

async function decideRequest(ctx, { org_id, id, decision, reason }){
  await ensureTables(ctx);
  const now=_now();
  const decision_norm = String(decision||'').toLowerCase();
  if (!['approved','rejected'].includes(decision_norm)) throw new Error('invalid_decision');

  if (ctx && ctx.db && typeof ctx.db.run === 'function') {
    await ctx.db.run(
      `UPDATE workflow_requests SET status=?, decision=?, decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE org_id=? AND id=?`,
      [decision_norm, decision_norm, String(reason||''), (ctx.actor_id||null), now, now, org_id, id]
    );
  }

  // Notify outcome
  try{
    await notify(ctx, {
      channel:'internal',
      to:'store.team',
      subject:`قرار الطلب ${id}: ${decision_norm}`,
      message:`تم اتخاذ قرار (${decision_norm}) على الطلب ${id}.`,
      meta:{ request_id:id, decision:decision_norm, reason:String(reason||'') }
    });
  }catch(e){}

  return { ok:true, id, status: decision_norm };
}


async function getRequestById(ctx, { org_id, id }){
  await ensureTables(ctx);
  if (ctx && ctx.db && typeof ctx.db.query === 'function') {
    const rows = await ctx.db.query(`SELECT * FROM workflow_requests WHERE org_id=? AND id=? LIMIT 1`, [org_id, id]);
    return rows && rows[0] ? rows[0] : null;
  }
  return null;
}

// P3.7: Apply effects for decisions (leader module -> service modules)
async function applyDecisionEffects(ctx, row, decision_norm, decision_reason){
  try{
    const payload = row && row.payload_json ? JSON.parse(row.payload_json) : {};
    if (!payload || typeof payload !== 'object') return;
    if (payload.kind === 'store_public_order') {
      const fi_id = payload.finance_intent_id;
      if (fi_id) {
        if (decision_norm === 'approved') {
          await financeIntents.setApproved({ org_id: ctx.org_id, id: fi_id, actor_id: (ctx.actor_id||ctx.user_id||null), reason: decision_reason });
          // Optional: create invoice skeleton (best effort) if finance invoices repo supports it
          try{
            const inv = await financeInvoices.createFromIntent?.({ org_id: ctx.org_id, intent_id: fi_id, actor_id: (ctx.actor_id||ctx.user_id||null) });
            if (inv && inv.id) await financeIntents.setFulfilled({ org_id: ctx.org_id, id: fi_id, invoice_id: inv.id });
          }catch(e){}
        } else if (decision_norm === 'rejected') {
          await financeIntents.setRejected({ org_id: ctx.org_id, id: fi_id, actor_id: (ctx.actor_id||ctx.user_id||null), reason: decision_reason });
        }
      }

      if (decision_norm === 'approved') {
        // Create execution task (operations leader)
        try{
          await opsTasks.create({
            org_id: ctx.org_id,
            branch_id: payload.branch_id || row.branch_id || null,
            title: `تنفيذ طلب متجر: ${payload.order_id}`,
            description: `طلب متجر عام - amount: ${payload.amount_total} - items: ${(payload.items||[]).length}`,
            source_type: 'workflow_request',
            source_id: row.id,
            status: 'open',
            assigned_role: 'operations.executor',
            assigned_user: null,
            meta: payload
          });
        }catch(e){}
      }

      // Decision artifact (DocNo + DMS + core artifact record)
      try{
        const doc_no = await nextDocNoAsync({ org_id: ctx.org_id, branch_id: payload.branch_id || row.branch_id || null, kind:'workflow_decision', prefix:'WD' });
        const html = render(`
<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9">
  <h2>قرار طلب (Workflow)</h2>
  <p><b>رقم المستند:</b> {{doc_no}}</p>
  <p><b>رقم الطلب:</b> {{req_id}}</p>
  <p><b>القرار:</b> {{decision}}</p>
  <p><b>السبب:</b> {{reason}}</p>
  <hr/>
  <pre style="background:#f6f6f6;padding:10px;border:1px solid #eee">{{json}}</pre>
</div>`, {
          doc_no, req_id: row.id, decision: decision_norm, reason: decision_reason, json: JSON.stringify(payload, null, 2)
        });

        const f = await dms.createFileFromContent(ctx, {
          folder_key: 'workflow_decisions',
          folder_path: `WORKFLOW/Decisions/${decision_norm}/${doc_no}`,
          filename: `workflow_decision_${doc_no}.html`,
          content: html,
          content_type: 'text/html',
          meta: { doc_no, request_id: row.id, decision: decision_norm, kind:'workflow_decision' }
        });

        await attachCoreArtifact(ctx, {
          entity_type:'workflow_request',
          entity_id: row.id,
          artifact_type:'workflow_decision',
          title:`Decision ${doc_no}`,
          dms_file_id: f && f.id ? f.id : null,
          meta: { doc_no, decision: decision_norm, reason: decision_reason }
        });
      }catch(e){}
    }
  }catch(e){}
}

module.exports

module.exports = { ensureTables, createRequest, listRequests, decideRequest };
