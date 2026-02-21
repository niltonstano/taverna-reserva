export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const VALID_ORDER_STATUSES: readonly OrderStatus[] = ORDER_STATUSES;
