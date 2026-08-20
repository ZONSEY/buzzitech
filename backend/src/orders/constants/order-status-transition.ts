import { OrderStatus } from 'generated/prisma';
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],

  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],

  [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],

  [OrderStatus.COMPLETED]: [],

  [OrderStatus.CANCELLED]: [],
};
