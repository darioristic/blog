import type { MetadataRoute } from "next";
import postsData from "./posts.json";
import { toISODate, year } from "./date";

export const revalidate = 3600;

const BASE_URL = "https://darioristic.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = postsData.posts.map(post => ({
    url: `${BASE_URL}/${year(post.date)}/${post.id}`,
    lastModified: toISODate(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: toISODate(postsData.posts[0].date),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    ...posts,
  ];
}
