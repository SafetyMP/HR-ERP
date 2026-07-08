/**
 * Capture README screenshots and demo GIF from a running dev server.
 *
 * Usage:
 *   npm ci && cp .env.example .env   # set JWT_SECRET
 *   npm run db:up && npm run demo:bootstrap && npm run dev
 *   npm run screenshots
 *
 * Optional: SCREENSHOT_BASE_URL=https://your-preview.example npm run screenshots
 *
 * CI: set CI=1 to use bundled Chromium instead of system Chrome.
 */
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import gifenc from "gifenc";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const outDir = path.join(repoRoot, "docs", "assets");
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";

const pages = [
  { path: "/employee", file: "employee-home.png", name: "Employee home" },
  { path: "/employee/paystub", file: "employee-paystub.png", name: "Paystub" },
  {
    path: "/employee/time",
    file: "employee-time.png",
    name: "Time & attendance",
  },
  {
    path: "/employee/benefits",
    file: "employee-benefits.png",
    name: "Benefits",
  },
];

/** Frame duration in milliseconds (gifenc stores delay/10 as GIF centiseconds). */
const GIF_FRAME_DELAY_MS = 2_000;

function launchOptions() {
  if (process.env.CI) {
    return { headless: true };
  }
  return { channel: "chrome", headless: true };
}

function mintDemoEmployeeJwt() {
  if (process.env.HR_ERP_DEMO_JWT?.trim()) {
    return process.env.HR_ERP_DEMO_JWT.trim();
  }

  const stdout = execFileSync("npm", ["run", "-s", "jwt:dev:demo-employee"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
  const token = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  if (!token) {
    throw new Error(
      "Could not mint demo employee JWT. Set JWT_SECRET in .env.",
    );
  }
  return token;
}

async function writeDemoGif(frames) {
  const encoder = GIFEncoder();
  for (const { buffer, name } of frames) {
    const { data, width, height } = PNG.sync.read(buffer);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    encoder.writeFrame(index, width, height, {
      palette,
      delay: GIF_FRAME_DELAY_MS,
    });
    console.log(`GIF frame: ${name}`);
  }
  encoder.finish();
  const gifPath = path.join(outDir, "demo.gif");
  await writeFile(gifPath, Buffer.from(encoder.bytes()));
  console.log(`Captured demo GIF -> docs/assets/demo.gif`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const jwt = mintDemoEmployeeJwt();
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.addInitScript((token) => {
    sessionStorage.setItem("hrerp_bearer_token", token);
  }, jwt);

  const gifFrames = [];

  for (const { path: route, file, name } of pages) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const buffer = await page.screenshot({ fullPage: false });
    const dest = path.join(outDir, file);
    await writeFile(dest, buffer);
    gifFrames.push({ buffer, name });
    console.log(`Captured ${name} -> docs/assets/${file}`);
  }

  await writeDemoGif(gifFrames);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
