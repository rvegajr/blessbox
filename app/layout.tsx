import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import 'aos/dist/aos.css'
import AuthSessionProvider from '@/components/providers/session-provider'

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist'
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'BlessBox - QR-Based Registration & Verification System',
  description: 'Streamline your organization\'s registration and verification process with QR codes',
  keywords: 'QR codes, registration, verification, organization management',
  authors: [{ name: 'BlessBox Team' }],
  openGraph: {
    title: 'BlessBox - QR-Based Registration & Verification System',
    description: 'Streamline your organization\'s registration and verification process with QR codes',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlessBox - QR-Based Registration & Verification System',
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
      <body className={`${geist.variable} ${geistMono.variable} font-sans`}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
