import type { Metadata, Viewport } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron', weight: ['400','500','600','700','800','900'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://revoluzion.my'),
  title: {
    default: 'Revoluzion Automotive',
    template: '%s | Revoluzion Automotive',
  },
  description:
    "Malaysia's premier automotive community — builds, events, marketplace, and more.",
  keywords: ['automotive', 'cars', 'Malaysia', 'community', 'builds', 'JDM', 'modified cars'],
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Revoluzion Automotive',
    description: "Malaysia's premier automotive community",
    url: 'https://revoluzion.my',
    siteName: 'Revoluzion Automotive',
    locale: 'en_MY',
    type: 'website',
    images: [{ url: '/favicon-512.png', width: 512, height: 512, alt: 'Revoluzion Automotive' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revoluzion Automotive',
    description: "Malaysia's premier automotive community",
    images: ['/favicon-512.png'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06B6D4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} dark h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
