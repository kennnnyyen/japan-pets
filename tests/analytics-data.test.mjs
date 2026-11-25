import assert from "node:assert/strict";
import test from "node:test";
import { advanceEnquiry, captureEnquiry, compareExpansion, readEnquiries, refreshWarehouse } from "../dist/analytics-data.mjs";

function demoStorage() {
  const records = new Map();
  return {
    get length() { return records.size; },
    key: index => [...records.keys()][index],
    getItem: key => records.get(key),
    setItem: (key, value) => records.set(key, value),
  };
}

test("an enquiry contributes once across all marts after handover", () => {
  const storage = demoStorage();
  const inventory = [{ id: "AN-088", site: "tokyo", status: "Available" }];
  const before = refreshWarehouse([], inventory);
  const date = new Date("2026-12-31T15:00:00Z");
  captureEnquiry(storage, { id: "lead-1", animalId: "AN-088", campaign: "line", date });

  assert.throws(() => advanceEnquiry(storage, "lead-1", 4), /changed/);
  for (const stage of [1, 2, 3]) advanceEnquiry(storage, "lead-1", stage, { date });
  assert.throws(() => advanceEnquiry(storage, "lead-1", 4, { price: 0, cost: 0, date }), /valid sale price/);
  advanceEnquiry(storage, "lead-1", 4, { price: 480000, cost: 165000, date });
  assert.throws(() => advanceEnquiry(storage, "lead-1", 4), /changed/);

  const after = refreshWarehouse(readEnquiries(storage), inventory);
  assert.deepEqual(refreshWarehouse(readEnquiries(storage), inventory), after);
  assert.equal(after.sales[0].sales, before.sales[0].sales + 1);
  assert.equal(after.sales[0].contribution - before.sales[0].contribution, 315000);
  const line = report => report.marketing.find(row => row.channel === "LINE campaign");
  assert.equal(line(after).sales, line(before).sales + 1);
  assert.equal(line(after).costPerSale, line(before).costPerSale);
  assert.equal(after.operations[0].ready, 0);
  assert.equal(after.operations[0].handovers, 1);
  assert.deepEqual(after.monthlyActivity.find(row => row.month === "2027-01" && row.site === "tokyo"),
    { month: "2027-01", site: "tokyo", enquiries: 1, viewings: 1, handovers: 1 });
});

test("closing a second enquiry for the same animal cannot record a second sale", () => {
  const storage = demoStorage();
  const date = new Date("2026-11-25T01:00:00Z");
  for (const id of ["first", "second"]) {
    captureEnquiry(storage, { id, animalId: "AN-088", date });
    for (const stage of [1, 2, 3]) advanceEnquiry(storage, id, stage, { date });
  }
  advanceEnquiry(storage, "first", 4, { price: 480000, cost: 165000, date });
  assert.throws(() => advanceEnquiry(storage, "second", 4, { price: 480000, cost: 165000, date }),
    /already has a completed demo handover/);
});

test("the scenario applies capacity, delay and upfront spending", () => {
  const assumptions = { demand: 38, delay: 0, startingCash: 250000000, contribution: 205000 };
  const [build, staged] = compareExpansion(assumptions);
  assert.equal(build.unservedDemand, 64);
  assert.equal(build.cash, 16760000);
  assert.equal(staged.cash, 159580000);
  const [delayed] = compareExpansion({ ...assumptions, delay: 4 });
  assert.ok(delayed.unservedDemand > build.unservedDemand);
  assert.ok(delayed.cash < build.cash);
  assert.equal(compareExpansion({ ...assumptions, startingCash: 0 })[0].firstShortfall, 0);
});
