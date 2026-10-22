import "server-only";
import type { Order } from "../payments/types";
import type { CustomerRepository } from "./customer-repository";
import type { CustomerRecord, EnrollmentDetails } from "./types";

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  getForOrder(orderId: string) { return this.repository.getByOrderId(orderId); }

  static prepareRegistration(details: EnrollmentDetails, order: Order): CustomerRecord {
    return {
      ...details, customerId: order.customer.id, orderId: order.id, createdAt: order.createdAt,
      packageName: order.packageSnapshot.packageName, startLevel: order.packageSnapshot.startLevel,
      targetLevel: order.packageSnapshot.targetLevel, attendance: order.attendance,
      paymentStatus: order.payment.status, source: order.customer.identitySource,
      marketing: { ...order.marketing },
    };
  }
}
