import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "paper.js");
const run = (args) => spawnSync(process.execPath, [cli, ...args], {
  encoding: "utf8",
  timeout: 10_000,
  env: { ...process.env, NO_COLOR: "1", BLIX_NO_FOOTER: "1", BLIX_QUIET: "1" },
});

function fixture(t, count = 25) {
  const dir = mkdtempSync(join(tmpdir(), "paper-history-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, "portfolio.json");
  const trades = Array.from({ length: count }, (_, i) => ({
    side: "buy",
    mint: `synthetic-mint-${i}`,
    symbol: `T${i}`,
    tokens: i + 1,
    sol: 0.1,
    price: 0.1,
    impact: 0,
    time: 1_700_000_000_000 + i,
  }));
  writeFileSync(file, JSON.stringify({
    version: 1,
    startSol: 10,
    cash: 10,
    positions: {},
    trades,
    createdAt: "2026-11-28T00:00:00.000Z",
  }));
  return file;
}

test("history rejects counts that are not positive integers", (t) => {
  const file = fixture(t);
  for (const count of ["0", "-3", "abc", "1.5"]) {
    const result = run(["history", count, "--file", file]);
    assert.equal(result.status, 1, `${count}: ${result.stderr}`);
    assert.match(result.stderr, /History count must be a whole number above 0\./);
  }
});

test("history returns exactly the requested number of most recent trades", (t) => {
  const file = fixture(t);
  const result = run(["history", "2", "--file", file, "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const trades = JSON.parse(result.stdout);
  assert.equal(trades.length, 2);
  assert.deepEqual(trades.map((trade) => trade.symbol), ["T24", "T23"]);
});

test("history retains the default limit of 20", (t) => {
  const file = fixture(t);
  const result = run(["history", "--file", file, "--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).length, 20);
});
