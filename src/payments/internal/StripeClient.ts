export type StripePayload = {
    id: string;
    amount: number;
    currency: string;
    metadata: { orderId: string };
};

export type StripeResponse = {
    charge_id: string;
    state: "succeeded" | "requires_action" | "declined";
};

export class StripeClient {
    async createCharge(payload: StripePayload): Promise<StripeResponse> {
        let state: "succeeded" | "requires_action" | "declined" = "succeeded";
        if (payload.id.startsWith("fail_")) {
            state = "declined";
        } else if (payload.id.startsWith("proc_")) {
            state = "requires_action";
        }
        return { charge_id: `ch_${payload.id}`, state };
    }
}