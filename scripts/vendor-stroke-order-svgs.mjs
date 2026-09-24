#!/usr/bin/env node
// Downloads stroke-order SVGs for every distinct Chinese/Japanese character used by the seed
// vocabulary migrations, so the Review page's stroke-order guide works offline/fast without
// depending on a live external CDN at runtime for the current word set (new words added later
// still work via a live fallback fetch in StrokeOrderDiagram — this script is just a performance/
// offline optimization for what's already seeded).
//
// Source: AnimCJK (https://github.com/parsimonhi/animCJK) — Arphic Public License (glyph SVGs).
// Each downloaded file keeps its original license header comment, so re-running this script is
// safe to do again whenever new zh/ja vocabulary is seeded (e.g. future HSK3+/N3+ additions).
//
// Usage: node scripts/vendor-stroke-order-svgs.mjs

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(repoRoot, "backend/src/main/resources/db/migration");
const outDir = path.join(repoRoot, "frontend/public/stroke-order");

const CDN_BASE = "https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@master";
// Try Chinese hanzi dir, then Japanese kanji dir, then Japanese kana dir — first hit wins.
const SOURCE_DIRS = ["svgsZhHans", "svgsJa", "svgsJaKana"];

const CJK_CHAR_PATTERN =
  /[一-鿿㐀-䶿぀-ゟ゠-ヿ豈-﫿]/gu;

function extractWordsFromMigrations() {
  const words = new Set();
  for (const file of ["V9__seed_starter_vocabulary.sql"]) {
    const fullPath = path.join(migrationsDir, file);
    if (!existsSync(fullPath)) continue;
    const sql = readFileSync(fullPath, "utf8");
    // Word is always the 2nd single-quoted string literal in each INSERT INTO vocabulary(...) row:
    // (SELECT id FROM language WHERE code = 'en'), 'word', 'meaning', ...
    const rowPattern = /\(SELECT id FROM language WHERE code = '(en|zh|ja)'\), '((?:[^'\\]|\\.)*)'/g;
    let match;
    while ((match = rowPattern.exec(sql)) !== null) {
      const [, languageCode, word] = match;
      if (languageCode === "zh" || languageCode === "ja") {
        words.add(word);
      }
    }
  }
  return words;
}

function extractCjkCharacters(words) {
  const chars = new Set();
  for (const word of words) {
    for (const char of word.match(CJK_CHAR_PATTERN) ?? []) {
      chars.add(char);
    }
  }
  return chars;
}

async function downloadOne(char) {
  const codepoint = char.codePointAt(0);
  const destPath = path.join(outDir, `${codepoint}.svg`);
  if (existsSync(destPath)) return { char, status: "skipped (already vendored)" };

  for (const dir of SOURCE_DIRS) {
    const url = `${CDN_BASE}/${dir}/${codepoint}.svg`;
    const response = await fetch(url);
    if (response.ok) {
      const svg = await response.text();
      writeFileSync(destPath, svg);
      return { char, status: `ok (${dir})` };
    }
  }
  return { char, status: "MISSING — no stroke data found in any source dir" };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const words = extractWordsFromMigrations();
  const chars = extractCjkCharacters(words);
  console.log(`Found ${words.size} zh/ja words, ${chars.size} distinct CJK/kana characters.`);

  const results = [];
  for (const char of chars) {
    // Sequential on purpose — polite to the free CDN, and this only runs occasionally.
    results.push(await downloadOne(char));
  }

  const missing = results.filter((r) => r.status.startsWith("MISSING"));
  const ok = results.filter((r) => r.status.startsWith("ok"));
  const skipped = results.filter((r) => r.status.startsWith("skipped"));
  console.log(`Downloaded: ${ok.length}, already vendored: ${skipped.length}, missing: ${missing.length}`);
  if (missing.length > 0) {
    console.log("Characters with no stroke data found:", missing.map((r) => r.char).join(" "));
  }
}

main();
