import type { MetadataRoute } from 'next'
import { getPosts } from './get-posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts()
  
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://darioristic.com/${new Date(post.date).getFullYear()}/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://darioristic.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://darioristic.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...postEntries,
  ]
}

