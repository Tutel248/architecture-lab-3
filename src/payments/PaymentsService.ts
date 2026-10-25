import type { PaymentRequest, PaymentResult } from "./types.ts";
import type { IPaymentProvider } from "./adapters/IPaymentProvider.ts";
import { StripeAdapter } from "./adapters/StripeAdapter.ts";
import { LocalPayAdapter } from "./adapters/LocalPayAdapter.ts";

export class PaymentsService {
    private readonly providers: Map<string, IPaymentProvider>;

    constructor(customProviders?: IPaymentProvider[]) {
        this.providers = new Map();
        const defaultProviders = customProviders ?? [new StripeAdapter(), new LocalPayAdapter()];
        for (const p of defaultProviders) {
            this.providers.set(p.name, p);
        }
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        const providerName = request.provider ?? "stripe";
        const provider = this.providers.get(providerName);

        if (!provider) {
            return {
                success: false,
                status: "failed",
                transactionId: "",
                provider: providerName,
                rawStatus: "UNKNOWN_PROVIDER",
            };
        }

        return provider.processPayment(request);
    }
}