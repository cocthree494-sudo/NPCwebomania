import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteRoutes } from "@/site/routes";

export const runtime = "nodejs";
const cache = new Map<string, Promise<string>>();

/** Serve the source document and hydrate its original React component graph.
 * The page is real same-origin DOM; there is no iframe or remote website proxy.
 */
export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "") || "/";
  const file = siteRoutes[pathname] ?? "404.html";
  if (process.env.NODE_ENV !== "production" || !cache.has(file)) {
    cache.set(file, readFile(join(process.cwd(), "src/site/pages", file), "utf8"));
  }
  return new Response(await cache.get(file), {
    status: file === "404.html" ? 404 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "Framer-Site-Id": "829b9f2d56fb5fbfa77aedcba0853c98715484922610ee4a184c65bfe21e18f1",
    },
  });
}
