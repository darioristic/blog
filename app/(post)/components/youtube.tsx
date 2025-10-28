"use client";
import YT from "react-youtube";
import Script from 'next/script'

export function YouTube({ videoId, title, ...props }: any) {
  const videoData = videoId ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title || 'YouTube Video',
    description: title || 'YouTube Video',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    uploadDate: new Date().toISOString(),
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  } : null;

  return (
    <span className="block my-5">
      {videoData && (
        <Script
          id={`youtube-structured-data-${videoId}`}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoData) }}
        />
      )}
      <YT width="100%" videoId={videoId} {...props} />
    </span>
  );
}
