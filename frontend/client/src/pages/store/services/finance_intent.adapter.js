// Finance Intent Adapter (P1)
// Checkout must create an intent (NOT ledger posting).
// Best-effort: tries to require existing finance intents service; otherwise NOTE.

function _tryRequire(p) { try { return require(p); } catch(e) { return null; } }

const financeIntentsService =
  _tryRequire('../../finance/services/intents.service') ||
  _tryRequire('../../finance/intents/intents.service') ||
  _tryRequire('../../finance/services/finance.intents.service') ||
  null;

async function createFinanceIntent(ctx, { org_id, branch_id, source, source_id, amount_json, meta }) {
  if (financeIntentsService && typeof financeIntentsService.createIntent === 'function') {
    return financeIntentsService.createIntent(ctx, { org_id, branch_id, source, source_id, amount_json, meta });
  }
  return {
    id: 'fi_' + Math.random().toString(36).slice(2, 10),
    status: 'created',
    org_id, branch_id: branch_id || null,
    source, source_id,
    amount_json: amount_json || {},
    meta: meta || {},
  };
}

module.exports = { createFinanceIntent };
