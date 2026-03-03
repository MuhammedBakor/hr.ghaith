// Store schemas (Zod) — scaffold
import { z } from "zod";

export const Id = z.string().min(6);
export const Reason = z.string().min(3);

export const Money = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
});

export const Product = z.object({
  id: Id,
  org_id: Id,
  branch_id: Id.optional(),
  sku: z.string().optional(),
  title: z.string().min(2),
  status: z.enum(["active","inactive","NOTE"]).default("active"),
  price: Money.optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const OrderLine = z.object({
  product_id: Id,
  qty: z.number().positive(),
  price: Money.optional(),
});

export const Order = z.object({
  id: Id,
  org_id: Id,
  branch_id: Id.optional(),
  customer_id: Id.optional(),
  status: z.enum(["draft","pending_payment","paid","cancelled","fulfilled","NOTE"]).default("draft"),
  lines: z.array(OrderLine).default([]),
  totals: z.record(z.string(), z.any()).optional(),
  finance_intent_id: Id.optional(),
  inventory_reserve_id: Id.optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const CheckoutRequest = z.object({
  reason: Reason,
  order_id: Id,
  payment_method: z.enum(["bank_transfer","card","cash","sadad"]).optional(),
});
