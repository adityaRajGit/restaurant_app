export const USER = "User";
export const ADMIN = "Admin";
export const SUPERADMIN = "superadmin";
export const MANAGER = "manager";

// Order lifecycle
export const PLACED = "placed";
export const CONFIRMED = "confirmed";
export const PREPARING = "preparing";
export const READY = "ready";
export const OUT_FOR_DELIVERY = "out_for_delivery";
export const DELIVERED = "delivered";
export const CANCELLED = "cancelled";

export const ORDER_STATUSES = [
  PLACED,
  CONFIRMED,
  PREPARING,
  READY,
  OUT_FOR_DELIVERY,
  DELIVERED,
  CANCELLED,
];

// Which status transitions are legal from a given status.
export const ORDER_STATUS_FLOW = {
  [PLACED]: [CONFIRMED, CANCELLED],
  [CONFIRMED]: [PREPARING, CANCELLED],
  [PREPARING]: [READY, CANCELLED],
  [READY]: [OUT_FOR_DELIVERY, DELIVERED],
  [OUT_FOR_DELIVERY]: [DELIVERED],
  [DELIVERED]: [],
  [CANCELLED]: [],
};

export const DINE_IN = "dine_in";
export const TAKEAWAY = "takeaway";
export const DELIVERY = "delivery";
export const ORDER_TYPES = [DINE_IN, TAKEAWAY, DELIVERY];

export const PAYMENT_PENDING = "pending";
export const PAYMENT_PAID = "paid";
export const PAYMENT_REFUNDED = "refunded";
export const PAYMENT_STATUSES = [
  PAYMENT_PENDING,
  PAYMENT_PAID,
  PAYMENT_REFUNDED,
];

export const MENU_CATEGORIES = [
  "Cakes",
  "Pastries",
  "Cookies & Biscuits",
  "Breads",
  "Desserts",
  "Beverages",
  "Other",
];

export const VEG = "veg";
export const NON_VEG = "non_veg";
export const EGG = "egg";
export const FOOD_TYPES = [VEG, NON_VEG, EGG];
