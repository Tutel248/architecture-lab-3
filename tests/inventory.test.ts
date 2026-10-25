import { test } from "node:test";
import assert from "node:assert";
import { InventoryService } from "../src/inventory/InventoryService.ts";
import { database, resetDatabase } from "../src/database.ts";

test("Out of stock throws error and guarantees atomic all-or-nothing stock state", async () => {
    resetDatabase();
    database.stock.set("itemA", { productId: "itemA", available: 5 });
    database.stock.set("itemB", { productId: "itemB", available: 1 });

    const inventory = new InventoryService();

    await assert.rejects(
        async () => {
            await inventory.reserve([
                { productId: "itemA", unitPrice: 10, quantity: 2 },
                { productId: "itemB", unitPrice: 20, quantity: 5 },
            ]);
        },
        /Insufficient stock/
    );

    assert.strictEqual(database.stock.get("itemA")?.available, 5);
    assert.strictEqual(database.stock.get("itemB")?.available, 1);
});