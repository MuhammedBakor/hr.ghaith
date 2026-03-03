// Store Orders Service (P1)
// M9 FIX: createDraftOrder الآن يحفظ في DB الحقيقي عبر tRPC
// الجدول المستخدم: store_orders (موجود في drizzle/schema.ts)
// db function: createStoreOrder في server/db.ts

const { createFinanceIntent } = require('./finance_intent.adapter');
const { createInventoryReserve } = require('./inventory_reserve.adapter');
const { createApprovalRequest } = require('./workflow.adapter');

let emitter = null;
try { emitter = require('../../../kernel/events/emitter'); } catch(e) { emitter = null; }

function nowIso(){ return new Date().toISOString(); }

/**
 * يحفظ الطلب في DB الحقيقي عبر tRPC endpoint
 */
async function persistOrderToDB(payload) {
  try {
    const res = await fetch('/api/trpc/store.createOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        json: {
          orderType: payload.orderType || 'sale',
          customerName: payload.customerName || payload.meta?.customerName || null,
          customerPhone: payload.customerPhone || payload.meta?.customerPhone || null,
          customerEmail: payload.customerEmail || payload.meta?.customerEmail || null,
          subtotal: String(payload.subtotal || payload.amount || 0),
          taxAmount: String(payload.taxAmount || 0),
          discountAmount: String(payload.discountAmount || 0),
          totalAmount: String(payload.totalAmount || payload.subtotal || payload.amount || 0),
          notes: payload.notes || null,
        }
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const result = data?.result?.data?.json;
      if (result?.id) return result;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      process.stderr.write(JSON.stringify({
        level: 'ERROR', module: 'store',
        msg: `createDraftOrder DB persist failed: ${err?.message}`,
        timestamp: nowIso()
      }) + '\n');
    }
  }
  return null;
}

module.exports = {
  async createDraftOrder(ctx, payload) {
    // M9 FIX: الحفظ الحقيقي في DB — استبدال in-memory
    const dbResult = await persistOrderToDB(payload);

    if (dbResult) {
      return {
        id: String(dbResult.id),
        orderNumber: dbResult.orderNumber,
        status: 'draft',
        meta: payload.meta || {},
        _persisted: true,
      };
    }

    // Fallback مع تحذير صريح
    const id = payload.id || ('order_' + Date.now().toString(36));
    if (process.env.NODE_ENV === 'production') {
      process.stderr.write(JSON.stringify({
        level: 'CRITICAL', module: 'store',
        msg: `createDraftOrder fallback to in-memory id=${id} — not persisted to DB`,
        timestamp: nowIso()
      }) + '\n');
    }
    return { id, status: 'draft', meta: payload.meta || {}, _persisted: false };
  },

  async checkout(ctx, payload) {
    const org_id = ctx?.org_id || payload.org_id;
    const branch_id = ctx?.branch_id || payload.branch_id;
    const reason = (payload && payload.reason) || ctx?.reason || 'checkout';
    const order_id = payload.order_id;

    const finance_intent = await createFinanceIntent(ctx, {
      org_id, branch_id,
      source: 'store_order', source_id: order_id,
      amount_json: payload.amount_json || payload.amount || {},
      meta: { payment_method: payload.payment_method || null },
    });

    const inventory_reserve = await createInventoryReserve(ctx, {
      org_id, branch_id,
      source: 'store_order', source_id: order_id,
      lines: payload.lines || [],
      meta: {},
    });

    const approval_request = await createApprovalRequest(ctx, {
      org_id, branch_id,
      title: `Store Checkout Approval: ${order_id}`,
      payload: { order_id, finance_intent_id: finance_intent.id, inventory_reserve_id: inventory_reserve.id },
      reason,
    });

    const eventPayload = {
      txn_id: ctx?.txn_id || ('txn_' + Date.now().toString(36)),
      org_id, branch_id,
      actor_id: ctx?.actor_id,
      occurred_at: nowIso(),
      entity: { id: order_id, type: 'store_order' },
      data: { order_id, finance_intent_id: finance_intent.id, approval_request_id: approval_request.id },
    };

    if (emitter && emitter.emit) {
      emitter.emit(null, 'store.order.checkout.created', eventPayload);
    }

    return { order_id, status: 'pending_approval', finance_intent, inventory_reserve, approval_request };
  },
};
