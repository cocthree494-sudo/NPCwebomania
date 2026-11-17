import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTelegramMessage, sendTelegramNotification } from "../src/lib/telegram.ts";

const contact = {
  kind: "contact" as const,
  id: "test-id",
  receivedAt: "2026-11-17T16:00:00.000Z",
  name: "Test Person",
  email: "test@example.com",
  phone: "+8801234567",
  company: "",
  service: "Website Design",
  consent: true,
};

test("contact message lists every form field", () => {
  const text = formatTelegramMessage(contact);
  assert.match(text, /New contact form submission/);
  assert.match(text, /Name: Test Person/);
  assert.match(text, /Email: test@example\.com/);
  assert.match(text, /Phone: \+8801234567/);
  assert.match(text, /Company \/ Project: —/);
  assert.match(text, /Service: Website Design/);
});

test("newsletter message lists the email only", () => {
  const text = formatTelegramMessage({ kind: "newsletter", id: "n1", receivedAt: contact.receivedAt, email: "a@b.co" });
  assert.match(text, /New newsletter signup/);
  assert.match(text, /Email: a@b\.co/);
});

test("notification is skipped when Telegram is not configured", async () => {
  let called = false;
  const sent = await sendTelegramNotification(contact, {}, (async () => {
    called = true;
    return new Response(null, { status: 200 });
  }) as typeof fetch);
  assert.equal(sent, false);
  assert.equal(called, false);
});

test("notification posts to the configured chat", async () => {
  let url = "";
  let payload: Record<string, unknown> = {};
  const sent = await sendTelegramNotification(
    contact,
    { TELEGRAM_BOT_TOKEN: "token-for-test", TELEGRAM_CHAT_ID: "-5331666965" },
    (async (input: unknown, init?: { body?: unknown }) => {
      url = String(input);
      payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch,
  );
  assert.equal(sent, true);
  assert.equal(url, "https://api.telegram.org/bottoken-for-test/sendMessage");
  assert.equal(payload.chat_id, "-5331666965");
  assert.match(String(payload.text), /Test Person/);
});

test("notification throws when Telegram rejects the request", async () => {
  await assert.rejects(
    sendTelegramNotification(
      contact,
      { TELEGRAM_BOT_TOKEN: "token-for-test", TELEGRAM_CHAT_ID: "-1" },
      (async () => new Response(JSON.stringify({ ok: false }), { status: 403 })) as typeof fetch,
    ),
    /403/,
  );
});
