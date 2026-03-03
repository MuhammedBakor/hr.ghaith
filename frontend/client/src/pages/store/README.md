# Store / Commerce Module (P1)
مسار مستقل داخل غيث للتجارة/الكتالوج/الطلبات.

## مبادئ
- Service-based
- Checkout لا يكتب Ledger مباشرة:
  - Finance Intent
  - Inventory Reserve Intent (اختياري)
  - Workflow Approval Request

## Status
- Catalog: scaffold (list)
- Orders: draft + checkout (P1) عبر adapters
- DB wiring: TODO حسب طبقة DB في الريبو
