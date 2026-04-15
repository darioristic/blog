export function YouTube({ videoId, title }: { videoId: string; title?: string }) {
  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1`;
  
  const videoData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title || 'YouTube Video',
    description: title || 'YouTube Video',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: embedUrl,
  };

  return (
    <div className="my-8" suppressHydrationWarning>
      <script
        id={`youtube-structured-data-${videoId}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoData) }}
      />
      <div className="relative w-full h-0 pb-[56.25%]" suppressHydrationWarning>
        <iframe
          src={embedUrl}
          title={title || 'YouTube video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg border-0"
          suppressHydrationWarning
        />
      </div>
      {title && (
        <p className="mt-3 text-sm text-neutral-500 text-center italic">
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Pogledaj na YouTube: {title}
          </a>
        </p>
      )}
    </div>
  );
}
