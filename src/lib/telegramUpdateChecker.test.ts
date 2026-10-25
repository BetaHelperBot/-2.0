import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTelegramChannelHtml } from "./telegramUpdateChecker.ts";

test("parseTelegramChannelHtml: recognizes update post with version and headline", () => {
  const sampleHtml = `
    <div class="tgme_widget_message_text">Привет всем! Это тестовый пост.</div>
    <div class="tgme_widget_message_text">⚡ Вышло новое обновление Heybo v2.1! Добавили голосовые заметки и улучшили тёмную тему.<br>Скачать APK можно по ссылке ниже.</div>
  `;

  const result = parseTelegramChannelHtml(sampleHtml);
  assert.equal(result.hasUpdate, true);
  assert.equal(result.version, "2.1");
  assert.match(result.headline || "", /Вышло новое обновление Heybo/);
  assert.match(result.messageText || "", /голосовые заметки/);
});

test("parseTelegramChannelHtml: ignores non-update general discussion posts", () => {
  const sampleHtml = `
    <div class="tgme_widget_message_text">Всем хорошего дня! Скоро будут интересные новости.</div>
  `;

  const result = parseTelegramChannelHtml(sampleHtml);
  assert.equal(result.hasUpdate, false);
});
