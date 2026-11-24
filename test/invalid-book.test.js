import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBook, newBook } from "../lib/book.js";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "paper.js");
const run = (args) => spawnSync(process.execPath, [cli, ...args], {
  encoding: "utf8",
  timeout: 10_000,
  env: { ...process.env, NO_COLOR: "1", BLIX_NO_FOOTER: "1", BLIX_QUIET: "1" },
});

test("invalid portfolio structures are rejected and reset must be finite", () => {
  const file = join(mkdtempSync(join(tmpdir(), "paper-invalid-")), "portfolio.json");
  for (const content of [
    "null",
    "{}",
    JSON.stringify({ version: 1, startSol: 10, cash: "9", positions: {}, trades: [] }),
  ]) {
    writeFileSync(file, content);
    const result = run(["history", "--file", file]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Cannot read .*portfolio\.json/);
  }

  const reset = run(["reset", "1e999", "--file", file]);
  assert.equal(reset.status, 1);
  assert.match(reset.stderr, /positive finite number/);
});


test("accepts a valid empty portfolio and keeps history usable", () => {
  const file = join(mkdtempSync(join(tmpdir(), "paper-valid-")), "portfolio.json");
  writeFileSync(file, JSON.stringify({
    version: 1,
    startSol: 10,
    cash: 10,
    positions: {},
    trades: [],
    createdAt: new Date().toISOString(),
  }));
  const result = run(["history", "--file", file]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /No trades yet/);
});


test("checkBook validates portfolio structure and finite balances", () => {
  const valid = newBook(10);
  assert.equal(checkBook(valid), valid);

  for (const invalid of [
    null,
    {},
    { ...newBook(), startSol: "10" },
    { ...newBook(), startSol: Infinity },
    { ...newBook(), cash: "9" },
    { ...newBook(), cash: -1 },
    { ...newBook(), cash: Infinity },
    { ...newBook(), positions: null },
    { ...newBook(), positions: [] },
    { ...newBook(), trades: {} },
  ]) {
    assert.throws(() => checkBook(invalid), /invalid portfolio structure/);
  }
});
