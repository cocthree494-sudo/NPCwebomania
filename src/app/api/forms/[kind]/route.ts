import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { validateSubmission } from "@/lib/submissions";

export const runtime = "nodejs";
const attempts = new Map<string, { count: number; expires: number }>();

export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) {
  const fail = (message: string, status: number) => Response.json({ error: { message } }, { status });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("Invalid origin.", 403);
  if (Number(request.headers.get("content-length") || 0) > 16384) return fail("Form is too large.", 413);
  const client = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  for (const [key, attempt] of attempts) if (attempt.expires < now) attempts.delete(key);
  const attempt = attempts.get(client) || { count: 0, expires: now + 60_000 };
  if (attempt.count >= 10) return fail("Please wait a moment before trying again.", 429);
  attempt.count++;
  attempts.set(client, attempt);

  let submission;
  try {
    const { kind } = await context.params;
    submission = validateSubmission(kind, await request.formData());
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid form.", 400);
  }

  const record = { id: randomUUID(), receivedAt: new Date().toISOString(), ...submission };
  try {
    const directory = process.env.SUBMISSIONS_DIRECTORY || join(process.cwd(), "data");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await appendFile(join(directory, "submissions.ndjson"), JSON.stringify(record) + "\n", { mode: 0o600 });
    if (process.env.FORM_WEBHOOK_URL) {
      const response = await fetch(process.env.FORM_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": record.id },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return fail("Your request was saved, but delivery is delayed. Please contact us by email.", 502);
    }
    return Response.json({ success: true, id: record.id });
  } catch {
    return fail("Unable to save your request. Please try again.", 500);
  }
}
