import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const read = (file) => readFileSync(file, "utf8");
const { site } = JSON.parse(read("src/config/config.json"));
const origin = site.base_url.replace(/\/+$/, "");
const sitemap = read("dist/sitemap-0.xml");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => new URL(match[1]).href,
);
assert.ok(urls.length > 0, "Sitemap 不應為空");
assert.equal(new Set(urls).size, urls.length, "Sitemap 不應有重複網址");
assert.equal(site.trailing_slash, false);

const pages = new Map(
  urls.map((url) => {
    const { pathname } = new URL(url);
    assert.ok(pathname === "/" || !pathname.endsWith("/"), url);
    assert.doesNotMatch(pathname, /^\/categories\/[^/]+\/page\/1$/);
    const html = read(path.join("dist", pathname.slice(1), "index.html"));
    return [url, html];
  }),
);

let translatedPages = 0;
for (const [url, html] of pages) {
  const { pathname } = new URL(url);
  const canonical = html.match(
    /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/,
  );
  assert.equal(canonical?.[1], url, `canonical 與 Sitemap 不一致：${url}`);
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const expectedLang =
    english || pathname === "/privacy-policy" ? "en" : "zh-Hant";
  assert.equal(
    html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1],
    expectedLang,
    url,
  );

  const zhPath = english ? pathname.slice(3) || "/" : pathname;
  const zhUrl = `${origin}${zhPath}`;
  const enUrl = `${origin}/en${zhPath === "/" ? "" : zhPath}`;
  const translated = pages.has(zhUrl) && pages.has(enUrl);
  const alternates = [
    ...html.matchAll(/<link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g),
  ].map((match) => [match[1], match[2]]);
  assert.deepEqual(
    alternates,
    translated
      ? [
          ["zh-Hant", zhUrl],
          ["en", enUrl],
        ]
      : [],
    `hreflang 必須完整且雙向對應現有頁面：${url}`,
  );
  if (translated) translatedPages++;

  for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    if (!href.startsWith("/")) continue;
    assert.ok(
      !href.startsWith("//"),
      `站內連結不應被當成其他網域：${url} → ${href}`,
    );
    const target = new URL(href, origin).pathname;
    assert.ok(target === "/" || !target.endsWith("/"), `${url} → ${href}`);
    assert.doesNotMatch(target, /^\/categories\/[^/]+\/page\/1$/);
  }
}
assert.ok(translatedPages > 0, "應有中英文對應頁面");
assert.match(read("dist/404.html"), /<html\b[^>]*lang="en"/);

const vercel = JSON.parse(read("vercel.json"));
assert.equal(vercel.trailingSlash, false);
const redirect = vercel.redirects.find(
  (item) => item.source === "/categories/:category/page/1",
);
assert.equal(redirect?.destination, "/categories/:category");
assert.equal(redirect?.permanent, true);
for (const url of urls) {
  const { pathname } = new URL(url);
  if (!/^\/categories\/[^/]+$/.test(pathname)) continue;
  assert.ok(
    !existsSync(path.join("dist", pathname.slice(1), "page/1/index.html")),
    pathname,
  );
}

console.log(
  `SEO 檢查通過：${pages.size} 個標準網址、${translatedPages} 個雙語頁面，分類第一頁與重新導向設定正常。`,
);
