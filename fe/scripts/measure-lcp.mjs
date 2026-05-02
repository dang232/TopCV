import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3005";
const routes = (process.env.ROUTES ?? "/,/login,/forms,/dashboard")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const slowMoMs = process.env.SLOWMO_MS ? Number(process.env.SLOWMO_MS) : 0;
const throttle = (process.env.THROTTLE ?? "1") !== "0";

// Roughly aligned with Lighthouse "Slow 4G" + CPU slowdown.
const throttlingProfile = {
  // 1.6 Mbps down / 750 Kbps up, ~150ms RTT
  downloadThroughput: 1.6 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 150,
  cpuThrottlingRate: 4,
};

function asNumberOrNull(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

async function measureRoute(page, route) {
  if (throttle) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: throttlingProfile.latency,
      downloadThroughput: throttlingProfile.downloadThroughput,
      uploadThroughput: throttlingProfile.uploadThroughput,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: throttlingProfile.cpuThrottlingRate,
    });
  }

  await page.addInitScript(() => {
    /** @type {any} */ (window).__lcp = { value: null, element: null, url: null };
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        const el = last.element;
        // store minimal identifying info (tag + classes) for reporting
        const element =
          el && el.tagName
            ? {
                tag: el.tagName,
                id: el.id || null,
                className: typeof el.className === "string" ? el.className : null,
                text: el.textContent ? el.textContent.slice(0, 80) : null,
              }
            : null;
        /** @type {any} */ (window).__lcp = {
          value: last.startTime,
          element,
          url: last.url || null,
        };
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // ignore
    }
  });

  const url = new URL(route, baseUrl).toString();
  const nav = await page.goto(url, { waitUntil: "networkidle" });
  // allow some post-load rendering/hydration; keep short to avoid skew
  await page.waitForTimeout(1500);

  const lcp = await page.evaluate(() => {
    return /** @type {any} */ (window).__lcp ?? null;
  });

  return {
    route,
    finalUrl: page.url(),
    status: nav?.status() ?? null,
    lcpMs: asNumberOrNull(lcp?.value),
    lcpElement: lcp?.element ?? null,
    lcpResourceUrl: lcp?.url ?? null,
    throttled: throttle,
  };
}

const browser = await chromium.launch({ headless: true, slowMo: slowMoMs });
const context = await browser.newContext();

const results = [];
for (const route of routes) {
  // new page per route to avoid perf observer bleed
  const p = await context.newPage();
  try {
    results.push(await measureRoute(p, route));
  } finally {
    await p.close();
  }
}

await browser.close();
console.log(
  JSON.stringify(
    {
      baseUrl,
      ts: new Date().toISOString(),
      results,
    },
    null,
    2,
  ),
);

