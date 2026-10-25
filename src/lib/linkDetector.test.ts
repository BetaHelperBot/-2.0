import test from "node:test";
import assert from "node:assert/strict";
import { extractLinks } from "./linkDetector.ts";

test("extractLinks recognizes YouTube links and generates correct labels", () => {
  const text = "Check out https://youtube.com/watch?v=dQw4w9WgXcQ and https://youtu.be/test123";
  const links = extractLinks(text);
  assert.equal(links.length, 2);
  assert.equal(links[0].platform, "youtube");
  assert.equal(links[0].label, "YouTube");
  assert.equal(links[0].color, "#FF0000");
  assert.equal(links[1].platform, "youtube");
});

test("extractLinks recognizes Telegram links", () => {
  const text = "Write to me at https://t.me/durov or join channel";
  const links = extractLinks(text);
  assert.equal(links.length, 1);
  assert.equal(links[0].platform, "telegram");
  assert.equal(links[0].label, "Telegram");
  assert.equal(links[0].description, "@durov");
});

test("extractLinks recognizes GitHub repos", () => {
  const text = "Source code: https://github.com/heybo/organizer";
  const links = extractLinks(text);
  assert.equal(links.length, 1);
  assert.equal(links[0].platform, "github");
  assert.equal(links[0].description, "Репозиторий heybo/organizer");
});

test("extractLinks handles generic web links cleanly", () => {
  const text = "Visit https://clck.ru/3ViDX4 for author page";
  const links = extractLinks(text);
  assert.equal(links.length, 1);
  assert.equal(links[0].platform, "link");
  assert.equal(links[0].label, "clck.ru");
});
