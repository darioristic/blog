import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api is JSON plumbing and /links only ever redirects elsewhere
      disallow: ["/api/", "/links/"],
    },
    sitemap: "https://darioristic.com/sitemap.xml",
    host: "https://darioristic.com",
  };
}
