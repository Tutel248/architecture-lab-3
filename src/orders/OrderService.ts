import { database } from "../database.ts";
import type { CartLine } from "../shared/calculateTotal.ts";
import { InventoryService } from "../inventory/InventoryService.ts";
import { PaymentsService } from "../payments/PaymentsService.ts";

export class OrderService {
    private readonly inventory: InventoryService;
    private readonly payments: PaymentsService;

    constructor(
        inventory = new InventoryService(),
        payments = new PaymentsService()
    ) {
        this.inventory = inventory;
        this.payments = payments;
    }

    async placeOrder(
        orderId: string,
        lines: CartLine[],
        total: number,
        paymentToken: string,
        currency: string,
        provider = "stripe"
    ) {
        await this.inventory.reserve(lines);

        database.orders.set(orderId, { id: orderId, status: "created", total });

        const paymentResult = await this.payments.processPayment({
            orderId,
            paymentToken,
            amount: total,
            currency,
            provider,
        });

        const order = database.orders.get(orderId)!;
        order.paymentStatus = paymentResult.status;

        if (paymentResult.status === "paid") {
            order.status = "confirmed";
        } else {
            order.status = "payment_pending";
        }

        return { ...order };
    }
}