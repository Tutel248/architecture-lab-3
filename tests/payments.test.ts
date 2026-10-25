import { test } from "node:test";
import assert from "node:assert";
import { PaymentsService } from "../src/payments/PaymentsService.ts";

test("Payment status normalization for paid status", () => {
    const service = new PaymentsService();
    assert.strictEqual(service.normalizeStatus("succeeded"), "paid");
});

test("Payment status normalization for processing status", () => {
    const service = new PaymentsService();
    assert.strictEqual(service.normalizeStatus("requires_action"), "processing");
});

test("Payment status normalization for failed status", () => {
    const service = new PaymentsService();
    assert.strictEqual(service.normalizeStatus("declined"), "failed");
});

test("Payment status normalization for unknown status defaults safely to failed", () => {
    const service = new PaymentsService();
    assert.strictEqual(service.normalizeStatus("UNKNOWN_PROVIDER_STATUS"), "failed");
});