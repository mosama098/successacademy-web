import "server-only";
import type { Order, PaymentProviderId } from "../types";

export type PaymentInitiation = {
  provider: PaymentProviderId;
  transactionId: string | null;
  redirectUrl: string | null;
  status: "waiting_payment";
};

export type PaymentVerification = {
  orderId: string;
  profileId?: string;
  transactionId: string;
  status: "waiting_payment" | "paid" | "failed" | "cancelled";
  amountMinor: number;
  currency: string;
};

export type PaymentProviderCustomer = {
  name: string;
  phone: string;
  email: string;
};

export type ProviderCallbackInput = {
  rawBody: string;
  headers: Readonly<Record<string, string>>;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createPayment(order: Order, customer: PaymentProviderCustomer): Promise<PaymentInitiation>;
  verifyPayment(transactionId: string): Promise<PaymentVerification>;
  handleCallback(input: ProviderCallbackInput): Promise<PaymentVerification>;
}

export interface NotificationService {
  sendEmail(order: Order, template: string): Promise<void>;
  sendWhatsApp(order: Order, template: string): Promise<void>;
  createCalendarEvent(order: Order, template: string): Promise<string>;
}
