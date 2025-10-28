import Link from 'next/link'
import postsData from '@/app/posts.json'

interface InternalLinkProps {
  query: string
  children: React.ReactNode
  className?: string
}

function getPostUrl(query: string): string | null {
  // Direct ID match
  const post = postsData.posts.find(
    p => p.id === query || p.id.includes(query) || query.includes(p.id)
  )
  
  if (post) {
    const year = new Date(post.date).getFullYear()
    return `/${year}/${post.id}`
  }
  
  // Title match
  const titleMatch = postsData.posts.find(
    p => p.title.toLowerCase().includes(query.toLowerCase())
  )
  
  if (titleMatch) {
    const year = new Date(titleMatch.date).getFullYear()
    return `/${year}/${titleMatch.id}`
  }
  
  return null
}

export function InternalLink({ query, children, className = '' }: InternalLinkProps) {
  const url = getPostUrl(query)
  
  if (!url) {
    // If no match found, return as plain text or external link
    return <span className={className}>{children}</span>
  }
  
  return (
    <Link
      href={url}
      className={`border-b text-gray-600 border-gray-300 transition-[border-color] hover:border-gray-600 dark:text-white dark:border-stone-600 dark:hover:border-white ${className}`}
    >
      {children}
    </Link>
  )
}

