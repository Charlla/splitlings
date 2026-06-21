import type { Metadata } from 'next'

// Auth flows are utility pages — keep them out of search and AI indexes.
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Splitlings to save your scores to the leaderboard.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
