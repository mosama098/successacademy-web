import "server-only";
import type { CustomerRecord } from "./types";

export interface CustomerRepository {
  getByOrderId(orderId: string): Promise<CustomerRecord | null>;
}

// Writes belong to OrderRepository.createIfAbsent's atomic booking transaction.
// A standalone customer insert would leave an orphan when order creation fails.
export class CustomerRepositoryUnavailableError extends Error {
  constructor() { super("Customer storage is unavailable"); this.name = "CustomerRepositoryUnavailableError"; }
}
