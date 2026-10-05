const test = require("node:test");
const assert = require("node:assert/strict");

const { parseCsv } = require("../src/modules/import-export/import-export.service");
const sessionService = require("../src/modules/sessions/session.service");

test("CSV parser supports quoted commas", () => {
  const rows = parseCsv('name,email,company\n"John, Doe",john@example.com,"ACME, Inc."\nJane,jane@example.com,Acme');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "John, Doe");
  assert.equal(rows[0].company, "ACME, Inc.");
});

test("session token hashing is deterministic and one-way shaped", () => {
  const first = sessionService.hash("example-refresh-token");
  const second = sessionService.hash("example-refresh-token");
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, "example-refresh-token");
});
