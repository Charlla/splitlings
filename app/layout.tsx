import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Splitlings — Split the orbs before they go supernova',
  description:
    'A fast-paced browser game where you tap orbs to split them before they grow to supernova size. Chain same-color splits for combo multipliers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
