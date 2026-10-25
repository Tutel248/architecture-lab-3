import type { IPaymentProvider } from "./IPaymentProvider.ts";
import type { PaymentRequest, PaymentResult, PaymentStatus } from "../types.ts";

export class LocalPayAdapter implements IPaymentProvider {
    readonly name = "localpay";

    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        let rawState = "COMPLETED";
        if (request.paymentToken.startsWith("fail_")) {
            rawState = "REJECTED";
        } else if (request.paymentToken.startsWith("proc_")) {
            rawState = "IN_PROGRESS";
        } else if (request.paymentToken.startsWith("unknown_")) {
            rawState = "UNEXPECTED_VAL";
        }

        const status = this.normalizeStatus(rawState);

        return {
            success: status === "paid" || status === "processing",
            status,
            transactionId: `loc_${request.orderId}`,
            provider: this.name,
            rawStatus: rawState,
        };
    }

    private normalizeStatus(rawState: string): PaymentStatus {
        if (rawState === "COMPLETED" || rawState === "SUCCESS") return "paid";
        if (rawState === "IN_PROGRESS" || rawState === "PENDING") return "processing";
        return "failed";
    }
}