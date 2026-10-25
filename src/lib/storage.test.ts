import { test } from "node:test";
import assert from "node:assert";
import { smartMergeData } from "./storage.ts";
import type { PasswordEntry, Note, Todo } from "./storage.ts";

test("smartMergeData non-destructively merges notes, passwords, and todos without overwriting existing items", () => {
  const existing = {
    passwords: [
      { id: "p1", title: "GitHub", password: "123", category: "other" as const, createdAt: 1000 },
    ],
    notes: [
      { id: "n1", title: "Existing Note", body: "Original body", createdAt: 1000, color: "#fff" },
    ],
    todos: [
      { id: "t1", text: "Buy milk", done: false, priority: "medium" as const, createdAt: 1000 },
    ],
  };

  const incoming = {
    passwords: [
      { id: "p1", title: "GitHub", password: "123", category: "other" as const, createdAt: 1000 }, // duplicate
      { id: "p2", title: "Steam", password: "456", category: "game" as const, createdAt: 2000 }, // new
    ],
    notes: [
      { id: "n2", title: "New Note", body: "New note body", createdAt: 2000, color: "#eee" }, // new
    ],
    todos: [
      { id: "t1", text: "Buy milk", done: false, priority: "medium" as const, createdAt: 1000 }, // duplicate
      { id: "t2", text: "Walk dog", done: true, priority: "high" as const, createdAt: 2000 }, // new
    ],
  };

  const result = smartMergeData(existing, incoming);

  // Existing must still be present
  assert.strictEqual(result.merged.passwords.length, 2);
  assert.strictEqual(result.merged.notes.length, 2);
  assert.strictEqual(result.merged.todos.length, 2);

  assert.strictEqual(result.added.passwords, 1);
  assert.strictEqual(result.added.notes, 1);
  assert.strictEqual(result.added.todos, 1);

  assert.strictEqual(result.merged.passwords[0].title, "GitHub");
  assert.strictEqual(result.merged.passwords[1].title, "Steam");
  assert.strictEqual(result.merged.notes[0].title, "Existing Note");
  assert.strictEqual(result.merged.notes[1].title, "New Note");
});
