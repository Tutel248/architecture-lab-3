import { test } from "node:test";
import assert from "node:assert";
import { PaymentsService } from "../src/payments/PaymentsService.ts";
import { StripeAdapter } from "../src/payments/adapters/StripeAdapter.ts";
import { LocalPayAdapter } from "../src/payments/adapters/LocalPayAdapter.ts";

test("StripeAdapter processes paid, processing, and failed statuses correctly", async () => {
    const adapter = new StripeAdapter();

    const paidRes = await adapter.processPayment({ orderId: "o1", paymentToken: "tok_ok", amount: 10, currency: "UAH" });
    assert.strictEqual(paidRes.status, "paid");

    const procRes = await adapter.processPayment({ orderId: "o2", paymentToken: "proc_3ds", amount: 10, currency: "UAH" });
    assert.strictEqual(procRes.status, "processing");

    const failRes = await adapter.processPayment({ orderId: "o3", paymentToken: "fail_card", amount: 10, currency: "UAH" });
    assert.strictEqual(failRes.status, "failed");
});

test("LocalPayAdapter processes paid, processing, and failed statuses correctly", async () => {
    const adapter = new LocalPayAdapter();

    const paidRes = await adapter.processPayment({ orderId: "o1", paymentToken: "tok_ok", amount: 10, currency: "UAH" });
    assert.strictEqual(paidRes.status, "paid");
    assert.strictEqual(paidRes.provider, "localpay");

    const procRes = await adapter.processPayment({ orderId: "o2", paymentToken: "proc_3ds", amount: 10, currency: "UAH" });
    assert.strictEqual(procRes.status, "processing");

    const failRes = await adapter.processPayment({ orderId: "o3", paymentToken: "fail_card", amount: 10, currency: "UAH" });
    assert.strictEqual(failRes.status, "failed");
});

test("PaymentsService handles unknown provider safely", async () => {
    const service = new PaymentsService();
    const res = await service.processPayment({ orderId: "o1", paymentToken: "tok", amount: 10, currency: "UAH", provider: "unknown_provider" });
    assert.strictEqual(res.status, "failed");
    assert.strictEqual(res.success, false);
});