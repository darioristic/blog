import Script from 'next/script'

type WebsiteData = {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  publisher: {
    '@type': string
    name: string
    url: string
    logo: {
      '@type': string
      url: string
    }
  }
  sameAs: string[]
}

type PersonData = {
  '@context': string
  '@type': string
  name: string
  jobTitle: string
  description: string
  url: string
  sameAs: string[]
  image?: string
}

type ArticleData = {
  '@context': string
  '@type': string
  headline: string
  description: string
  image?: string[]
  datePublished: string
  dateModified: string
  author: {
    '@type': string
    name: string
    url: string
  }
  publisher: {
    '@type': string
    name: string
    url: string
    logo: {
      '@type': string
      url: string
    }
  }
  mainEntityOfPage: {
    '@type': string
    '@id': string
  }
}

export function WebsiteStructuredData({ url }: { url: string }) {
  const data: WebsiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Dario Ristic's Blog",
    description:
      'Technology executive and consultant focused on DevOps, cloud infrastructure, and cross-functional teams.',
    url,
    publisher: {
      '@type': 'Person',
      name: 'Dario Ristic',
      url: 'https://darioristic.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://darioristic.com/icon.png',
      },
    },
    sameAs: [
      'https://twitter.com/dario_ristic',
      'https://linkedin.com/in/darioristic',
    ],
  }

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function PersonStructuredData({
  includeImage = false,
}: {
  includeImage?: boolean
}) {
  const data: PersonData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Dario Ristic',
    jobTitle: 'Technology Executive & Consultant',
    description:
      'Technology executive with 20+ years building cloud platforms, leading teams, and creating companies that bridge innovation and business value.',
    url: 'https://darioristic.com',
    sameAs: [
      'https://twitter.com/dario_ristic',
      'https://linkedin.com/in/darioristic',
    ],
    ...(includeImage && {
      image: 'https://darioristic.com/images/dario_ristic.png',
    }),
  }

  return (
    <Script
      id="person-structured-data"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function ArticleStructuredData({
  title,
  description,
  date,
  image,
  url,
}: {
  title: string
  description: string
  date: string
  image?: string
  url: string
}) {
  const publishedDate = new Date(date).toISOString()

  const data: ArticleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    ...(image && { image: [image] }),
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      '@type': 'Person',
      name: 'Dario Ristic',
      url: 'https://darioristic.com',
    },
    publisher: {
      '@type': 'Person',
      name: 'Dario Ristic',
      url: 'https://darioristic.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://darioristic.com/icon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <Script
      id="article-structured-data"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

