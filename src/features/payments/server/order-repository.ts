import "server-only";
import type { Order, PaymentEvent, PaymentVerification } from "../types";
import type { PromoRedemptionGuard } from "../../promos/types";
import type { AuditRecord, BookingRecords } from "./booking-records";

export type CreateOrderResult = {
  order: Order;
  created: boolean;
};

export interface OrderRepository {
  // Promo usage and the order must commit atomically; retries must not consume a second use.
  createIfAbsent(order: Order, event: PaymentEvent, records: BookingRecords, promo?: PromoRedemptionGuard): Promise<CreateOrderResult>;
  findByIdempotencyKeyHash(idempotencyKeyHash: string): Promise<Order | null>;
  getById(orderId: string): Promise<Order | null>;
  ensurePromoReservation(orderId: string): Promise<void>;
  commitTransition(order: Order, event: PaymentEvent, audit: AuditRecord): Promise<Order>;
  createVerification(verification: PaymentVerification, event: PaymentEvent): Promise<PaymentVerification>;
  updateVerification(verification: PaymentVerification, event: PaymentEvent): Promise<PaymentVerification>;
}

export class OrderRepositoryUnavailableError extends Error {
  constructor(message = "Order storage is unavailable") {
    super(message);
    this.name = "OrderRepositoryUnavailableError";
  }
}

export class OrderRepositoryConflictError extends Error {
  constructor(message = "The order changed concurrently") {
    super(message);
    this.name = "OrderRepositoryConflictError";
  }
}
