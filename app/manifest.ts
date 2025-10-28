import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dario Ristic's Blog",
    short_name: 'Dario Blog',
    description:
      'Technology executive and consultant focused on DevOps, cloud infrastructure, and cross-functional teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfcfc',
    theme_color: '#fcfcfc',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}

