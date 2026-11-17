import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { notifierCandidates, sendViaNotifierBinary } from "../src/lib/notifier.ts";

const record = {
  kind: "contact" as const,
  id: "n-test",
  receivedAt: "2026-11-17T17:10:00.000Z",
  name: "Notifier Test",
  email: "notifier@example.com",
  phone: "+8801000000000",
  company: "",
  service: "Development",
  consent: true,
};

async function fakeBinary(script: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "notifier-test-"));
  const path = join(dir, "npc-telegram-notifier");
  await writeFile(path, script);
  await chmod(path, 0o755);
  return path;
}

test("candidate paths are checked in the documented order", () => {
  const paths = notifierCandidates("/srv/site");
  assert.equal(paths[0], "/srv/site/bin/npc-telegram-notifier");
  assert.equal(paths[1], "/opt/npc-automators/npc-telegram-notifier");
  assert.match(paths[2], /npc-telegram-notifier\/target\/release\/npc-telegram-notifier$/);
});

test("returns false when no binary is installed", async () => {
  const sent = await sendViaNotifierBinary(record, ["/nonexistent/npc-telegram-notifier"]);
  assert.equal(sent, false);
});

test("pipes the record JSON to the binary on stdin", async () => {
  const dir = await mkdtemp(join(tmpdir(), "notifier-test-"));
  const received = join(dir, "received.json");
  const binary = await fakeBinary(`#!/bin/sh\ncat > ${received}\nexit 0\n`);
  const sent = await sendViaNotifierBinary(record, [binary]);
  assert.equal(sent, true);
  const payload = JSON.parse(await readFile(received, "utf8"));
  assert.equal(payload.email, "notifier@example.com");
  assert.equal(payload.kind, "contact");
});

test("throws when an installed binary fails", async () => {
  const binary = await fakeBinary("#!/bin/sh\nexit 1\n");
  await assert.rejects(sendViaNotifierBinary(record, [binary]), /failed/);
});
