import { calculateTotal, type CartLine } from "../shared/calculateTotal.ts";
import { OrderService } from "../orders/OrderService.ts";
import { auditLog, runtimeConfig } from "../config.ts";

export type CheckoutRequest = {
    orderId: string;
    paymentToken: string;
    currency: string;
    lines: CartLine[];
    provider?: string;
};

export class CheckoutController {
    private readonly orders: OrderService;

    constructor(orders = new OrderService()) {
        this.orders = orders;
    }

    async checkout(request: CheckoutRequest) {
        const total = calculateTotal(
            request.lines,
            runtimeConfig.taxRate,
            runtimeConfig.discountPercent
        );

        auditLog.push(`total_calculated:${total}`);

        const order = await this.orders.placeOrder(
            request.orderId,
            request.lines,
            total,
            request.paymentToken,
            request.currency,
            request.provider
        );

        return {
            orderId: order.id,
            status: order.status,
            total: order.total,
            paymentStatus: order.paymentStatus,
        };
    }
}