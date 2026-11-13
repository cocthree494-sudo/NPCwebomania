import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSubmission } from "../src/lib/submissions.ts";

test("newsletter accepts email and ignores untrusted extra fields", () => {
  const data = new FormData();
  data.set("Email", "test@example.com");
  data.set("role", "admin");
  assert.deepEqual(validateSubmission("newsletter", data), { kind: "newsletter", email: "test@example.com" });
});
test("contact requires consent and a known service", () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ Name: "Test", Email: "test@example.com", "Phone Number": "+8801234567", "Visa Type": "Website Design" })) data.set(key, value);
  assert.throws(() => validateSubmission("contact", data), /Privacy/);
  data.set("Privacy Policy", "on");
  assert.equal(validateSubmission("contact", data).consent, true);
  data.set("Visa Type", "invalid");
  assert.throws(() => validateSubmission("contact", data), /service/);
});
test("invalid emails and unknown form kinds fail", () => {
  const data = new FormData();
  data.set("Email", "not-an-email");
  assert.throws(() => validateSubmission("newsletter", data), /email/);
  assert.throws(() => validateSubmission("unknown", data), /Unknown/);
});
