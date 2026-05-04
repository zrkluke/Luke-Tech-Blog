import type { APIRoute } from "astro";
import config from "@/config/config.json";

export const prerender = true;

export const GET: APIRoute = () => {
  const base = config.site.base_url.replace(/\/+$/, "");
  const sitemapUrl = `${base}/sitemap-index.xml`;
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /api/*",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
