import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Your personal daily habit companion',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Habits' },
}

export const viewport: Viewport = {
  themeColor: '#090909',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/api/icon/192" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#090909' }}>
        {children}
      </body>
    </html>
  )
}
