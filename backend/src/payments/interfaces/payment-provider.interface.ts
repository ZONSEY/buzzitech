export interface CreateCheckoutResponse {
  checkoutUrl: string;
  providerPaymentId: string;
  providerPaymentIntentId?: string;
}

export interface RefundResponse {
  success: boolean;
  providerRefundId?: string;
}

export interface PaymentProvider {
  createCheckout(orderId: string): Promise<CreateCheckoutResponse>;

  refund(paymentId: string): Promise<RefundResponse>;

  handleWebhook(payload: Buffer, signature: string): Promise<void>;
}
