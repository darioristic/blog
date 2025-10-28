import Script from 'next/script'

interface ArticleMetadataProps {
  title: string
  description: string
  date: string
  image?: string
  url: string
}

export function ArticleMetadata({
  title,
  description,
  date,
  image,
  url,
}: ArticleMetadataProps) {
  const publishedDate = new Date(date).toISOString()

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: {
      '@type': 'Person',
      name: 'Dario Ristic',
      url: 'https://darioristic.com',
      sameAs: [
        'https://twitter.com/dario_ristic',
        'https://linkedin.com/in/darioristic',
      ],
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

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://darioristic.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: url,
      },
    ],
  }

  return (
    <>
      <Script
        id="article-structured-data"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  )
}

