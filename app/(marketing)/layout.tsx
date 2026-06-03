import { type ReactNode } from 'react'

// Marketing pages use the full-width no-sidebar layout
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
