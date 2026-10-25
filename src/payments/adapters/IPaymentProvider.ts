import type { PaymentRequest, PaymentResult } from "../types.ts";

export interface IPaymentProvider {
    readonly name: string;
    processPayment(request: PaymentRequest): Promise<PaymentResult>;
}