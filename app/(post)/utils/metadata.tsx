import type { Metadata } from 'next'

interface PostMetadata {
  title: string
  description: string
  date: string
  keywords?: string[]
}

export function generatePostMetadata(postId: string, metadata: PostMetadata): Metadata {
  const year = new Date(metadata.date).getFullYear()
  const url = `https://darioristic.com/${year}/${postId}`
  const ogImageUrl = `https://darioristic.com/og/${postId}`

  // Extract keywords from title and add custom keywords
  const baseKeywords = metadata.title
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 3) // Filter out short words

  const customKeywords = metadata.keywords || []
  const allKeywords = [
    'Dario Ristic',
    'cloud infrastructure',
    'DevOps',
    'cloud-native',
    'platform engineering',
    'technology blog',
    ...customKeywords,
    ...baseKeywords,
  ]

  return {
    title: metadata.title,
    description: metadata.description,
    authors: [{ name: 'Dario Ristic', url: 'https://darioristic.com' }],
    creator: 'Dario Ristic',
    publisher: 'Dario Ristic',
    keywords: allKeywords,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url,
      siteName: "Dario Ristic's Blog",
      type: 'article',
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
      publishedTime: metadata.date,
      authors: ['Dario Ristic'],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      creator: '@dario_ristic',
      site: '@dario_ristic',
      images: [ogImageUrl],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:author': 'Dario Ristic',
      'article:published_time': metadata.date,
    },
  }
}

