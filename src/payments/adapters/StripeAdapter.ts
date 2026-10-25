import type { IPaymentProvider } from "./IPaymentProvider.ts";
import type { PaymentRequest, PaymentResult, PaymentStatus } from "../types.ts";
import { StripeClient, type StripePayload } from "../internal/StripeClient.ts";

export class StripeAdapter implements IPaymentProvider {
    readonly name = "stripe";
    private readonly client: StripeClient;

    constructor(client = new StripeClient()) {
        this.client = client;
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        const payload: StripePayload = {
            id: request.paymentToken,
            amount: Math.round(request.amount * 100),
            currency: request.currency,
            metadata: { orderId: request.orderId },
        };

        const response = await this.client.createCharge(payload);
        const status = this.normalizeStatus(response.state);

        return {
            success: status === "paid" || status === "processing",
            status,
            transactionId: response.charge_id,
            provider: this.name,
            rawStatus: response.state,
        };
    }

    private normalizeStatus(rawState: string): PaymentStatus {
        if (rawState === "succeeded") return "paid";
        if (rawState === "requires_action") return "processing";
        return "failed";
    }
}