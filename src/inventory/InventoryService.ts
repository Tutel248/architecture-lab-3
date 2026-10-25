import { StockRepository } from "./StockRepository.ts";
import type { CartLine } from "../shared/calculateTotal.ts";

export class InventoryService {
    private readonly stockRepo: StockRepository;

    constructor(stockRepo = new StockRepository()) {
        this.stockRepo = stockRepo;
    }

    async reserve(lines: CartLine[]): Promise<void> {
        for (const line of lines) {
            const stock = this.stockRepo.find(line.productId);
            const available = stock?.available ?? 0;
            if (available < line.quantity) {
                throw new Error(`Insufficient stock for ${line.productId}`);
            }
        }

        for (const line of lines) {
            const stock = this.stockRepo.find(line.productId)!;
            this.stockRepo.updateAvailable(line.productId, stock.available - line.quantity);
        }
    }
}