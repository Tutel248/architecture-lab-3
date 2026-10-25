# Architecture review

> Аналіз архітектурних порушень у початковому варіанті проєкту.

| Principle | Evidence (file:line) | Practical risk | Fix |
|---|---|---|---|
| **Information Hiding** | `src/checkout/CheckoutController.ts:22` | Контролер транспорту знає внутрішню структуру об'єкта `StripePayload` та конвертує копійки. Будь-яка зміна провайдера вимагатиме правок у транспортному шарі. | Передати нейтральний токен та валюту в `OrderService` / `PaymentsService`, приховавши деталь реалізації всередині адаптера. |
| **Ownership** | `src/orders/OrderService.ts:21` | Модуль `Orders` напряму змінює базу даних `database.stock.set()`, минаючи модуль `Inventory`. Це дозволяє записати від'ємні залишки в обхід правил складу. | Передати управління залишками в `InventoryService.reserve()`, що монопольно захищає інваріант `available >= 0`. |
| **Dependency Direction** | `src/payments/internal/StripeClient.ts:2` | Модуль `Payments` імпортує `markOrderPaid` із `orders/internal`, утворюючи циклічну залежність `Orders -> Payments -> Orders`. | Прибрати виклик `markOrderPaid` із `Payments`. Сервіс `Payments` повинен повертати результат через DTO. |
| **Local Reasoning** | `src/shared/calculateTotal.ts:10-22` | Функція `calculateTotal` читає глобальні конфіги `runtimeConfig`, мутує вхідний масив `lines` та робить сайд-ефект `auditLog.push()`. | Зробити функцію чистою: передавати `taxRate` і `discountPercent` явно, повертати обчислений `total` без мутацій вхідних даних. |
| **High Cohesion** | `src/orders/mapPaymentStatus.ts:1`, `src/notifications/mapPaymentStatus.ts:1`, `src/reports/mapPaymentStatus.ts:1` | Логіка нормалізації статусу провайдера продубльована у 3 різних місцях. Зміна статусів провайдера вимагає правок у трьох модулях одночасно. | Монопольно винести мапінг статусів всередину модуля `Payments`. |

## Change impact prediction (заповнити до реалізації change request)

**Requirement:**
Підтримка другого payment provider та нового нормалізованого статусу `processing` без зміни публічного API `Checkout`.

**Expected files:**
- `src/payments/PaymentsService.ts`
- `src/payments/types.ts`
- `src/payments/adapters/StripeAdapter.ts`
- `src/payments/adapters/LocalPayAdapter.ts`
- `src/orders/OrderService.ts`
- `src/checkout/CheckoutController.ts`
- `src/inventory/InventoryService.ts`
- `src/shared/calculateTotal.ts`
- `scripts/check-architecture.js`
- `DECISIONS.md`
- `REVIEW.md`
- `ADR-001-payments-boundary.md`

**Modules that should not change:**
- `src/notifications/`
- `src/reports/`
- `src/database.ts`
- `src/config.ts`

## Actual impact (заповнити після реалізації)

*(Буде заповнено після завершення рефакторингу)*