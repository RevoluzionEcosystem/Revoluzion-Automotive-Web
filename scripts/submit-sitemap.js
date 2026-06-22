#!/usr/bin/env node
const https = require('https')
const http = require('http')

const sitemapUrl = process.env.SITEMAP_URL || 'https://revoluzion.my/sitemap.xml'

function ping(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, (res) => {
      const { statusCode } = res
      // consume body
      res.on('data', () => {})
      res.on('end', () => resolve({ url, statusCode }))
    })
    req.on('error', (err) => resolve({ url, error: err.message }))
    req.setTimeout(15000, () => {
      req.abort()
      resolve({ url, error: 'timeout' })
    })
  })
}

;(async () => {
  console.log(`Submitting sitemap: ${sitemapUrl}`)

  const endpoints = [
    `http://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/webmaster/ping.aspx?siteMap=${encodeURIComponent(sitemapUrl)}`,
  ]

  for (const ep of endpoints) {
    console.log(`Pinging ${ep}`)
    try {
      const r = await ping(ep)
      if (r.error) {
        console.error(`Failed: ${r.url} -> ${r.error}`)
      } else {
        console.log(`Response: ${r.url} -> ${r.statusCode}`)
      }
    } catch (err) {
      console.error(`Error pinging ${ep}:`, err)
    }
  }
})()
