import { test } from "node:test";
import assert from "node:assert/strict";
import { validDob, daysUntilBirthday } from "../src/lib/birthdays.js";
test("reject invalid and future DOBs", () => {
  assert.equal(validDob("2023-02-29"), false);
  assert.equal(validDob("2024-02-29"), true);
  assert.equal(validDob("2999-01-01"), false);
  assert.equal(validDob("2000-13-01"), false);
});
test("today and year rollover", () => {
  assert.equal(daysUntilBirthday("2000-12-31", new Date(2026, 11, 31)), 0);
  assert.equal(daysUntilBirthday("2000-01-01", new Date(2026, 11, 31)), 1);
});
test("leap day policy and leap year", () => {
  assert.equal(daysUntilBirthday("2000-02-29", new Date(2027, 1, 28)), 0);
  assert.equal(daysUntilBirthday("2000-02-29", new Date(2028, 1, 28)), 1);
});
