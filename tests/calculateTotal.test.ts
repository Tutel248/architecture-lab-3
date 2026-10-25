import { test } from "node:test";
import assert from "node:assert";
import { calculateTotal, type CartLine } from "../src/shared/calculateTotal.ts";

test("calculateTotal is pure: does not mutate input lines and calculates accurately", () => {
    const lines: CartLine[] = [{ productId: "item1", unitPrice: 100, quantity: 2 }];
    const linesCopy = JSON.parse(JSON.stringify(lines));

    const total = calculateTotal(lines, 0.2, 10);

    assert.strictEqual(total, 216);
    assert.deepStrictEqual(lines, linesCopy);
});