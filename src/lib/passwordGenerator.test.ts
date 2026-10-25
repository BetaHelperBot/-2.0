import test from "node:test";
import assert from "node:assert/strict";
import { buildPassword, generateQuickPassword, getStrength } from "./passwordGenerator.ts";

test("buildPassword generates password with requested length", () => {
  const p1 = buildPassword({ length: 16, upper: true, lower: true, digits: true, special: true });
  assert.equal(p1.length, 16);

  const p2 = buildPassword({ length: 8, upper: false, lower: true, digits: false, special: false });
  assert.equal(p2.length, 8);
  assert.match(p2, /^[a-z]+$/);
});

test("generateQuickPassword generates 14 character password with mixed characters", () => {
  const p = generateQuickPassword();
  assert.equal(p.length, 14);
  assert.match(p, /[A-Z]/);
  assert.match(p, /[a-z]/);
  assert.match(p, /[0-9]/);
  assert.match(p, /[!@#$%^&*]/);
});

test("getStrength evaluates password strength properly", () => {
  const weak = getStrength("abc");
  assert.equal(weak.label, "Слабый");

  const medium = getStrength("Pass1234");
  assert.ok(["Слабый", "Средний"].includes(medium.label));

  const strong = getStrength("K#9vL$2wQ!8zP@1x");
  assert.equal(strong.label, "Отличный");
  assert.equal(strong.color, "#1B5E20");
});
