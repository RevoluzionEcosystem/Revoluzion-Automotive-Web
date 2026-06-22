import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://revoluzion.my'
  const staticUrls = ['/', '/feed', '/community', '/marketplace', '/garage', '/guides']

  const pages = staticUrls.map((p) => ({ url: `${baseUrl}${p}`, lastModified: new Date().toISOString() }))
  return pages
}
