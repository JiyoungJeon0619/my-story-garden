import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '내 이야기',
  description: '말하면 살아나는, 나의 기억 정원',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-cream-50 text-stone-800 antialiased">
        {children}
      </body>
    </html>
  )
}
