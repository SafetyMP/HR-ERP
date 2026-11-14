/** Local preview of only the generated demo export, including a Pages subpath. */
import { createServer } from "node:http";
import { open } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  fileURLToPath(new URL("../demo/out/", import.meta.url)),
);
const base = (process.env.DEMO_BASE_PATH ?? "/HR-ERP").replace(/\/$/, "");
const port = Number(process.env.DEMO_PORT ?? 3109);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid DEMO_PORT");
if (base && !/^\/[A-Za-z0-9_/-]+$/.test(base))
  throw new Error("Invalid DEMO_BASE_PATH");
const indexProbe = await open(path.join(root, "index.html"), "r");
await indexProbe.close();
createServer(async (req, res) => {
  let file;
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    if (base && pathname === base) {
      res.writeHead(308, { Location: `${base}/` });
      res.end();
      return;
    }
    if (base && !pathname.startsWith(`${base}/`)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const relative = pathname.slice(base.length);
    const filename = path.resolve(
      root,
      `.${relative}${relative.endsWith("/") ? "index.html" : ""}`,
    );
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    // Inspect and read the same opened file; never stat a path then reopen it.
    file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
    if (!(await file.stat()).isFile()) throw new Error("Not a regular file");
    const body = await file.readFile();
    res.writeHead(200, {
      "Content-Type": `${types[path.extname(filename)] ?? "application/octet-stream"}; charset=utf-8`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  } finally {
    await file?.close();
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Demo preview: http://127.0.0.1:${port}${base}/`),
);
