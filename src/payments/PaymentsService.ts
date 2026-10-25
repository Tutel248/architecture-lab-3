import { StripeClient, type StripePayload } from "./internal/StripeClient.ts";
import type { PaymentRequest, PaymentResult, PaymentStatus } from "./types.ts";

export class PaymentsService {
    private readonly stripe: StripeClient;

    constructor(stripe = new StripeClient()) {
        this.stripe = stripe;
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        const payload: StripePayload = {
            id: request.paymentToken,
            amount: Math.round(request.amount * 100),
            currency: request.currency,
            metadata: { orderId: request.orderId },
        };

        const response = await this.stripe.createCharge(payload);
        const status = this.normalizeStatus(response.state);

        return {
            success: status === "paid" || status === "processing",
            status,
            transactionId: response.charge_id,
            rawStatus: response.state,
        };
    }

    normalizeStatus(rawState: string): PaymentStatus {
        if (rawState === "succeeded") return "paid";
        if (rawState === "requires_action") return "processing";
        if (rawState === "declined") return "failed";
        return "failed";
    }
}