import Link from "next/link";

export function A({ children, className = "", href, rel, ...props }) {
  // Allow custom rel to be overridden
  const getRel = (linkType: string, customRel?: string) => {
    if (customRel) return customRel;
    
    if (linkType === 'external') {
      // Add nofollow to external links for SEO
      return 'noopener noreferrer nofollow';
    }
    // Internal links use dofollow (don't add rel="nofollow")
    return undefined;
  };

  if (href[0] === "#") {
    // Anchor links (same page)
    return (
      <a
        href={href}
        className={`border-b text-gray-600 border-gray-300 transition-[border-color] hover:border-gray-600 dark:text-white dark:border-stone-600 dark:hover:border-white ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  } else if (href[0] === "/") {
    // Internal link - dofollow for SEO
    return (
      <Link
        href={href}
        className={`border-b text-gray-600 border-gray-300 transition-[border-color] hover:border-gray-600 dark:text-white dark:border-stone-600 dark:hover:border-white ${className}`}
        rel={rel}
        {...props}
      >
        {children}
      </Link>
    );
  } else {
    // External link - nofollow for SEO
    const relAttr = rel || getRel('external');
    return (
      <a
        href={href}
        target="_blank"
        rel={relAttr}
        className={`border-b text-gray-600 border-gray-300 transition-[border-color] hover:border-gray-600 dark:text-white dark:border-stone-600 dark:hover:border-white ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }
}
