// Workflow Adapter (P1)
// Checkout should create approval request via workflow/requests module if available.

function _tryRequire(p) { try { return require(p); } catch(e) { return null; } }

const workflowService =
  _tryRequire('../../workflow/services/requests.service') ||
  _tryRequire('../../requests/services/requests.service') ||
  _tryRequire('../../workflow/services/workflow.requests.service') ||
  null;

async function createApprovalRequest(ctx, { org_id, branch_id, title, payload, reason, module_key='store', assigned_role='store.manager', assigned_user=null }) {
  if (workflowService && typeof workflowService.createRequest === 'function') {
    return workflowService.createRequest(ctx, { org_id, branch_id, title, payload, reason, module_key, assigned_role, assigned_user });
  }
  return {
    id: 'wr_' + Math.random().toString(36).slice(2, 10),
    status: 'pending',
    org_id, branch_id: branch_id || null,
    title,
    payload,
    reason,
  };
}

module.exports = { createApprovalRequest };
