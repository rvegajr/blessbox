import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
// import 'aos/dist/aos.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { TutorialSystemLoader } from '@/components/TutorialSystemLoader'
import { TrakletDevWidget } from '@/components/dev/TrakletDevWidget'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read per-request CSP nonce set by middleware.ts. Reading headers()
  // also opts this layout out of static rendering, ensuring the nonce
  // is regenerated per request and Next.js applies it to its own
  // Flight payload <script> tags.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  void nonce // available to pass to any <Script nonce={nonce} /> tags
  // Hard gate: never mount the Traklet dev widget in production, even if
  // NEXT_PUBLIC_TRAKLET_ENABLED is accidentally set. The PAT lives server-side
  // in TRAKLET_PAT and is brokered through /api/dev/traklet-proxy.
  const showTraklet =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_TRAKLET_ENABLED === 'true'
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans`}>
        <AuthProvider>
          {children}
          <TutorialSystemLoader />
          {showTraklet ? <TrakletDevWidget /> : null}
        </AuthProvider>
      </body>
    </html>
  )
}
