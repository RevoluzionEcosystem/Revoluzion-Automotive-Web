import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Revoluzion Automotive',
    template: '%s | Revoluzion Automotive',
  },
  description:
    "Malaysia's premier automotive community — builds, events, marketplace, and more.",
  keywords: ['automotive', 'cars', 'Malaysia', 'community', 'builds', 'JDM', 'modified cars'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    title: 'Revoluzion Automotive',
    description: "Malaysia's premier automotive community",
    url: 'https://revoluzion.my',
    siteName: 'Revoluzion Automotive',
    locale: 'en_MY',
    type: 'website',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'Revoluzion Automotive' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revoluzion Automotive',
    description: "Malaysia's premier automotive community",
    images: ['/logo.png'],
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
    <html lang="en" className={`${inter.variable} dark h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
