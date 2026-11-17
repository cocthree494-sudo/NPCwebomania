import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import type { SubmissionRecord } from "@/lib/telegram";

export const NOTIFIER_BINARY_NAME = "npc-telegram-notifier";

/**
 * Where the form endpoint looks for the notifier binary, in order.
 * The binary carries its Telegram credentials compiled in, so the site
 * needs no environment configuration. The compiled binary is committed at
 * bin/npc-telegram-notifier by the owner's decision; anyone who downloads
 * it can extract the token, so that file is effectively a credential.
 */
export function notifierCandidates(cwd: string = process.cwd()): string[] {
  return [
    join(cwd, "bin", NOTIFIER_BINARY_NAME),
    "/opt/npc-automators/npc-telegram-notifier",
    join(cwd, "..", "npc-telegram-notifier", "target", "release", NOTIFIER_BINARY_NAME),
  ];
}

export type ExecFileFn = (
  file: string,
  args: string[],
  options: { input: string; timeout: number; maxBuffer: number },
) => Promise<{ stdout: string; stderr: string }>;

const defaultExec: ExecFileFn = (file, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(file, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Notifier binary timed out."));
    }, options.timeout);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.length > options.maxBuffer) child.kill("SIGKILL");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Notifier binary exited with code ${code}.`));
    });
    child.stdin.end(options.input);
  });

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pipes the submission record as JSON to the notifier binary's stdin.
 * Returns false when no binary is installed at any known location, so the
 * caller can fall back to another delivery method. Throws when a binary
 * was found but every copy failed to deliver.
 */
export async function sendViaNotifierBinary(
  record: SubmissionRecord,
  candidates: string[] = notifierCandidates(),
  execFn: ExecFileFn = defaultExec,
  existsFn: (path: string) => Promise<boolean> = exists,
): Promise<boolean> {
  let found = false;
  for (const candidate of candidates) {
    if (!(await existsFn(candidate))) continue;
    found = true;
    try {
      await execFn(candidate, [], {
        input: JSON.stringify(record),
        timeout: 25_000,
        maxBuffer: 1 << 20,
      });
      return true;
    } catch {
      // Try the next installed copy before giving up.
    }
  }
  if (found) throw new Error("Notifier binary failed to deliver the submission.");
  return false;
}
