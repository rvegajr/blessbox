import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BlessBox - QR-based Registration & Verification',
  description: 'Streamline your organization\'s registration and verification process with QR codes',
  keywords: 'QR codes, registration, verification, organization management',
  authors: [{ name: 'BlessBox Team' }],
  openGraph: {
    title: 'BlessBox - QR-based Registration & Verification',
    description: 'Streamline your organization\'s registration and verification process with QR codes',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlessBox - QR-based Registration & Verification',
    description: 'Streamline your organization\'s registration and verification process with QR codes',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
