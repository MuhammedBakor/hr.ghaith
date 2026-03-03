// Inventory Reserve Adapter (P1)
// v1: reserve intent hook (optional).

function _tryRequire(p) { try { return require(p); } catch(e) { return null; } }

const inventoryService =
  _tryRequire('../../inventory/services/reserve.service') ||
  _tryRequire('../../warehouse/services/reserve.service') ||
  null;

async function createInventoryReserve(ctx, { org_id, branch_id, source, source_id, lines, meta }) {
  if (inventoryService && typeof inventoryService.createReserve === 'function') {
    return inventoryService.createReserve(ctx, { org_id, branch_id, source, source_id, lines, meta });
  }
  return {
    id: 'ir_' + Math.random().toString(36).slice(2, 10),
    status: 'created',
    org_id, branch_id: branch_id || null,
    source, source_id,
    lines: lines || [],
    meta: meta || {},
  };
}

module.exports = { createInventoryReserve };
