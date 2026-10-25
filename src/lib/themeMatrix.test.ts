import test from "node:test";
import assert from "node:assert/strict";
import {
  detectDominantTheme,
  THEME_CONFIGS,
  THEME_TRIGGERS,
} from "./themeMatrix.ts";

test("Theme Matrix: has over 150 keywords across all 10 theme families", () => {
  let totalKeywords = 0;
  for (const list of Object.values(THEME_TRIGGERS)) {
    totalKeywords += list.length;
  }
  // At least 150 trigger regexes or high density
  assert.ok(totalKeywords >= 150, `Expected at least 150 keywords, found ${totalKeywords}`);
});

test("Theme Matrix: weighted voting picks the theme with most keyword hits", () => {
  // 3 brawl words (кубки, леон, спайк), 1 minecraft word (алмазы)
  const text = "Я апнул кубки играя за леон и спайк, а потом нашел алмазы в шахте";
  const dominant = detectDominantTheme(text);
  assert.equal(dominant, "brawlstars");
});

test("Theme Matrix: tie-breaking fallback chooses the theme that appeared earlier in the text", () => {
  // 1 minecraft word (майнкрафт) at index 0, 1 brawl word (бравл) at later index
  const text = "майнкрафт был первой игрой, а потом я включил бравл";
  const dominant = detectDominantTheme(text);
  assert.equal(dominant, "minecraft");

  // Reverse order: brawl first
  const text2 = "бравл был первой игрой, а потом я запустил майнкрафт";
  const dominant2 = detectDominantTheme(text2);
  assert.equal(dominant2, "brawlstars");
});

test("Theme Matrix: direct override 'Оформление: [Тема]' takes unconditional precedence", () => {
  // Even with 5 brawl keywords, explicit override for minecraft wins
  const text = "Оформление: Майнкрафт\nАпнул кубки, выбил леон, потом спайк, потом шелли и броулбол";
  const dominant = detectDominantTheme(text);
  assert.equal(dominant, "minecraft");
});

test("Theme Matrix: fallback to default when no keywords match", () => {
  const text = "Обычный список покупок: хлеб, молоко, яблоки, сыр";
  const dominant = detectDominantTheme(text);
  assert.equal(dominant, "default");
});

test("Theme Matrix: light mode color schemes are clean and light (never pitch dark)", () => {
  for (const config of Object.values(THEME_CONFIGS)) {
    // Light mode background must NOT be slate-900 or pitch black
    assert.ok(!config.light.bg.includes("slate-900"), `${config.key} light bg must not be slate-900`);
    assert.ok(!config.light.bg.includes("bg-[#0"), `${config.key} light bg must not be dark hex`);
    // Dark mode background should be OLED deep
    assert.ok(
      config.dark.bg.includes("bg-[#") || config.dark.bg.includes("bg-black") || config.dark.bg.includes("bg-slate-900"),
      `${config.key} dark bg must be dark`
    );
  }
});
