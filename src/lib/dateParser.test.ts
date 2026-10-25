import test from "node:test";
import assert from "node:assert/strict";
import { parseDueDate, getSmartMessage } from "./dateParser.ts";

test("parseDueDate parses 'сегодня' and 'завтра'", () => {
  const ref = new Date(2026, 4, 15, 10, 0, 0); // 15 May 2026
  const today = parseDueDate("сегодня", ref);
  assert.ok(today);
  assert.equal(today.getDate(), 15);
  assert.equal(today.getHours(), 20);

  const tomorrow = parseDueDate("завтра", ref);
  assert.ok(tomorrow);
  assert.equal(tomorrow.getDate(), 16);
  assert.equal(tomorrow.getHours(), 9);
});

test("parseDueDate parses relative days and dates like '20 мая' or '20.05'", () => {
  const ref = new Date(2026, 4, 15, 10, 0, 0);
  const in3Days = parseDueDate("через 3 дня", ref);
  assert.ok(in3Days);
  assert.equal(in3Days.getDate(), 18);

  const ruDate = parseDueDate("20 мая", ref);
  assert.ok(ruDate);
  assert.equal(ruDate.getDate(), 20);
  assert.equal(ruDate.getMonth(), 4);
});

test("getSmartMessage creates categorized smart notification texts", () => {
  const workout = getSmartMessage("Утренняя тренировка в зале");
  assert.match(workout, /💪 Не забудь про тренировку/);

  const dev = getSmartMessage("Сделать коммит и деплой приложения");
  assert.match(dev, /💻 Дедлайн по разработке/);

  const study = getSmartMessage("Подготовиться к экзамену по физике");
  assert.match(study, /📚 Учёба не ждёт/);

  const shop = getSmartMessage("Купить продукты в магазине");
  assert.match(shop, /🛒 Не забудь/);
});
