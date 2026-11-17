import type { Submission } from "@/lib/submissions";

export type SubmissionRecord = Submission & { id: string; receivedAt: string };

export function formatTelegramMessage(record: SubmissionRecord): string {
  if (record.kind === "newsletter") {
    return [
      "New newsletter signup — NPC Automators",
      "",
      `Email: ${record.email}`,
      `Received: ${record.receivedAt}`,
      `ID: ${record.id}`,
    ].join("\n");
  }
  return [
    "New contact form submission — NPC Automators",
    "",
    `Name: ${record.name ?? ""}`,
    `Email: ${record.email}`,
    `Phone: ${record.phone ?? ""}`,
    `Company / Project: ${record.company || "—"}`,
    `Service: ${record.service ?? ""}`,
    `Received: ${record.receivedAt}`,
    `ID: ${record.id}`,
  ].join("\n");
}

/**
 * Sends a submission to a Telegram chat (group) through a bot.
 * Returns false without doing anything when TELEGRAM_BOT_TOKEN or
 * TELEGRAM_CHAT_ID is not configured, so the integration stays opt-in.
 * Throws when Telegram is configured but delivery fails.
 */
export async function sendTelegramNotification(
  record: SubmissionRecord,
  env: NodeJS.ProcessEnv = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return false;
  const response = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatTelegramMessage(record),
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Telegram delivery failed with status ${response.status}.`);
  }
  return true;
}
