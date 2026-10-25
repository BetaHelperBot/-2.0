import { test } from "node:test";
import assert from "node:assert";
import { parseGoalFromText, updateGoalInText } from "./goalsEngine.ts";

test("parseGoalFromText parses fraction goals", () => {
  const goal = parseGoalFromText("Мой список\nЦель: 500/1000 кубков\nПродолжаем играть");
  assert.notStrictEqual(goal, null);
  assert.strictEqual(goal?.current, 500);
  assert.strictEqual(goal?.max, 1000);
  assert.strictEqual(goal?.unit, "кубков");
  assert.strictEqual(goal?.percent, 50);
  assert.strictEqual(goal?.isComplete, false);
});

test("parseGoalFromText parses single target number", () => {
  const goal = parseGoalFromText("Цель: 2000 трофеев в сезоне");
  assert.notStrictEqual(goal, null);
  assert.strictEqual(goal?.current, 0);
  assert.strictEqual(goal?.max, 2000);
  assert.strictEqual(goal?.unit, "трофеев");
});

test("updateGoalInText increments and decrements correctly", () => {
  const initial = "Заметка\nЦель: 5/10 глав\nВсе супер";
  const incremented = updateGoalInText(initial, 1);
  assert.strictEqual(incremented.goal?.current, 6);
  assert.ok(incremented.updatedText.includes("Цель: 6/10 глав"));

  const completed = updateGoalInText(incremented.updatedText, 4);
  assert.strictEqual(completed.goal?.current, 10);
  assert.strictEqual(completed.goal?.isComplete, true);
  assert.strictEqual(completed.goal?.percent, 100);

  const decremented = updateGoalInText(completed.updatedText, -2);
  assert.strictEqual(decremented.goal?.current, 8);
  assert.strictEqual(decremented.goal?.isComplete, false);
});
