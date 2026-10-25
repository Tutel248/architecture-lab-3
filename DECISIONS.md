# Decision log

## Decision 1: Payment Status Normalization in Payments Module

**Problem:** Мапінг статусів був продубльований у модулях `orders`, `notifications` та `reports`, що викликало розсинхронізацію статусів.

**Evidence:** Файли `src/orders/OrderService.ts` та `src/notifications/mapPaymentStatus.ts` окремо перетворювали відповіді провайдера.

**Decision:** Консолідували мапінг статусів усередині `PaymentsService` та адаптерів, повертаючи єдині нормалізовані статуси системи (`paid`, `processing`, `failed`).

**Why:** Централізація забезпечує приховування інформації, запобігає розходженню статусів та ізолює структури провайдерів від доменних модулів.

**Alternative:** Створення спільної утиліти в `src/shared/mapStatus.ts`.

**Why rejected:** Залишає структури провайдера видимими для зовнішніх споживачів, порушуючи приховування інформації та низьку зв'язаність.

**Trade-off:** Споживачі повністю покладаються на нормалізовані статуси і не можуть напряму перевіряти сирі поля провайдера.

**Verification:** Юніт-тести в `tests/payments.test.ts` перевіряють мапінг для статусів `paid`, `processing`, `failed` та невідомого статусу.

## Decision 2: Processing Status Support in Order Workflow

**Problem:** Система підтримувала лише статуси `paid` та `failed`, що унеможливлювало обробку асинхронних або багатокрокових платежів.

**Evidence:** Контролер `src/checkout/CheckoutController.ts` відносив усі неуспішні відповіді провайдера одразу до помилок.

**Decision:** Додали нормалізований статус `processing`, який переводить замовлення в стан `payment_pending` без зміни логіки `paid` та `failed`.

**Why:** Готує систему до асинхронних платіжних шлюзів, зберігаючи зворотну сумісність публічного API чекауту.

**Alternative:** Негайне відхилення незавершених транзакцій із вимогою повторного проходження чекауту.

**Why rejected:** Знижує конверсію покупок та не відповідає реальному життєвому циклу обробки платежів.

**Trade-off:** Процеси виконання замовлень повинні обробляти тимчасовий стан очікування перед остаточним підтвердженням.

**Verification:** Інтеграційний тест перевіряє, що токен `proc_` успішно переводить замовлення у стан `payment_pending`.

## Decision 3: Inventory Stock Ownership and Atomic Reservation

**Problem:** `OrderService` напряму читав і оновлював `database.stock`, ігноруючи правила `Inventory` та створюючи ризик від'ємних залишків.

**Evidence:** `src/orders/OrderService.ts:16-26` робив запити `database.stock.get` та оновлював `database.stock` безпосередньо.

**Decision:** Реалізували `InventoryService.reserve(lines)`, який контролює інваріанти залишків (`available >= 0`) та гарантує атомарне резервування.

**Why:** Повертає власність над даними модулю `Inventory`, гарантує `available >= 0` і запобігає псуванню залишків.

**Alternative:** Додавання циклу скасування (Rollback) усередині `OrderService` для відновлення знятих товарів при помилці.

**Why rejected:** Розміщення логіки скасування в `OrderService` порушує ownership та дублює складські правила.

**Trade-off:** `InventoryService` повинен виконувати попередню перевірку всіх позицій кошика перед списанням залишків.

**Verification:** Юніт-тести перевіряють, що спроба замовити відсутній товар викликає помилку та залишає залишки незмінними.

## Decision 4: Elimination of Orders-Payments Circular Dependency

**Problem:** `StripeClient` імпортував `markOrderPaid`, що створювало циклічну залежність та витоки логіки оновлення замовлення у платежі.

**Evidence:** `src/payments/internal/StripeClient.ts:2` імпортував `markOrderPaid` із файлу `../../orders/internal/orderMutations.ts`.

**Decision:** Видалили виклики `markOrderPaid` із `Payments`. `PaymentsService` синхронно повертає DTO `PaymentResult` для оновлення стану в `OrderService`.

**Why:** Формує односпрямований граф залежностей (`Checkout` -> `Orders` -> `Payments`), повністю усуваючи циклічні імпорти.

**Alternative:** Використання Event Emitter усередині `StripeClient` для надсилання події про завершення платежу.

**Why rejected:** Подієві зворотні виклики у синхронному чекауті додають зайву складність та приховують потік виконання.

**Trade-off:** `OrderService` повинен явно обробляти оновлення статусів замовлення на основі отриманого DTO `PaymentResult`.

**Verification:** Тест підтверджує відсутність циклів та імпортів із `orders/internal`.