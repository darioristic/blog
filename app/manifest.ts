import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dario Ristic's Blog",
    short_name: 'Dario Blog',
    description:
      'Dario Ristic is a technology executive and consultant specializing in DevSecOps, cloud infrastructure, platform engineering, and high-performing cross-functional teams.',
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

