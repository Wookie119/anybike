import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.AUDIT_BASE_URL || "https://www.anybike.co.uk";
const marketDir = path.join(process.cwd(), "markets");
const slugs = fs.readdirSync(marketDir)
  .filter((name) => name.endsWith(".html"))
  .map((name) => name.replace(/\.html$/i, ""))
  .sort();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const results = [];

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const url = `${base}/markets/${slug}.html?healthAudit=${Date.now()}`;
  console.log(`[${i + 1}/${slugs.length}] ${slug}`);

  let result = {
    slug,
    url,
    country: slug,
    status: "fail",
    flagOk: false,
    localCount: 0,
    gatewayOk: false,
    linkCount: 0,
    legacyShippingCount: 0,
    staleBuyerWording: false,
    jsErrors: [],
    issues: []
  };

  const jsErrors = [];
  const onPageError = (err) => jsErrors.push(String(err?.message || err));
  page.on("pageerror", onPageError);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1800);

    result = await page.evaluate(({ slug, url, jsErrors }) => {
      const titleCase = (s) => s.split("-").map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(" ");
      const issues = [];
      const country = (document.querySelector(".country-line strong")?.textContent || titleCase(slug)).trim();

      const flagHost = document.querySelector(".country-flag");
      const flag = flagHost?.querySelector("img");
      const flagSrc = flag?.getAttribute("src") || "";
      const flagOk = !!flag &&
        /flagcdn\.com\/w\d+\/[a-z]{2}\.png/i.test(flagSrc) &&
        getComputedStyle(flagHost).visibility !== "hidden";
      if (!flagOk) issues.push("Flag missing or not finalised");

      const local = document.querySelector(".anybike-market-local-standard");
      const placeLinks = [...(local?.querySelectorAll(".area-list a") || [])];
      const placeLabels = placeLinks
        .map(a => a.textContent.replace(/[→↗]/g, "").trim())
        .filter(Boolean);

      const generic = /^(UK Port Delivery|Freight Forwarder|Approved Shipping Point|Deal Documents|Route & compliance review|Destination gateway to confirm)$/i;
      const localPlaces = placeLabels.filter(x => !generic.test(x));
      if (localPlaces.length < 3) issues.push("Fewer than 3 local towns/cities/regions");

      const gatewayCard = [...(local?.querySelectorAll(".port-card") || [])]
        .find(card => /gateway|port|landlocked|route & compliance/i.test(card.querySelector("h3")?.textContent || ""));
      const gatewayOk = !!gatewayCard;
      if (!gatewayOk) issues.push("No destination gateway/landlocked route card");

      const linkCount = placeLinks.length;
      if (linkCount < 3) issues.push("Locality/gateway pills are not sufficiently clickable");

      const bodyText = document.body?.innerText || "";
      const escaped = country.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
      const staleBuyerWording = new RegExp("\\b" + escaped + " buyers\\b", "i").test(bodyText);
      if (staleBuyerWording) issues.push("Stale '[country] buyers' wording remains");

      const legacyShippingCount = [...document.querySelectorAll("h2,h3")]
        .filter(el => /shipping \/ delivery options/i.test(el.textContent || "")).length;
      if (legacyShippingCount) issues.push("Legacy shipping/delivery card wording remains");

      if (jsErrors.length) issues.push("JavaScript errors: " + jsErrors.slice(0, 3).join(" | "));

      const failPattern = /Flag missing|No destination|Stale|Legacy|JavaScript errors/;
      const status = issues.some(x => failPattern.test(x)) ? "fail" : issues.length ? "warn" : "pass";

      return {
        slug,
        url,
        country,
        status,
        flagOk,
        localCount: localPlaces.length,
        gatewayOk,
        linkCount,
        legacyShippingCount,
        staleBuyerWording,
        jsErrors,
        issues
      };
    }, { slug, url, jsErrors });
  } catch (err) {
    result.issues.push("Render failed: " + String(err?.message || err));
  } finally {
    page.off("pageerror", onPageError);
  }

  results.push(result);
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: base,
  total: results.length,
  pass: results.filter(r => r.status === "pass").length,
  warn: results.filter(r => r.status === "warn").length,
  fail: results.filter(r => r.status === "fail").length
};

fs.mkdirSync("audit-output", { recursive: true });
fs.writeFileSync("audit-output/market-page-health.json", JSON.stringify({ summary, results }, null, 2));

const lines = [
  "# AnyBike Market Page Health",
  "",
  `Generated: ${summary.generatedAt}`,
  "",
  `- Total: ${summary.total}`,
  `- Pass: ${summary.pass}`,
  `- Warnings: ${summary.warn}`,
  `- Failures: ${summary.fail}`,
  "",
  "## Non-passing pages",
  ""
];

for (const r of results.filter(r => r.status !== "pass")) {
  lines.push(`- **${r.status.toUpperCase()} — ${r.country}** (/${r.slug}.html): ${r.issues.join("; ")}`);
}
if (!results.some(r => r.status !== "pass")) lines.push("- None");

fs.writeFileSync("audit-output/market-page-health.md", lines.join("\n"));

console.log("\nMARKET_PAGE_HEALTH_SUMMARY " + JSON.stringify(summary));
