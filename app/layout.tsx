import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
// import 'aos/dist/aos.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { TutorialSystemLoader } from '@/components/TutorialSystemLoader'
import { TrakletDevWidget } from '@/components/dev/TrakletDevWidget'
import { EnvChrome } from '@/lib/env-chrome/EnvChrome'
import { badgeFor } from '@/lib/env-chrome/chrome'
import { resolveServerEnv } from '@/lib/env-chrome/resolve'
import { HOST_RULES } from '@/env-chrome.config'

const BASE_TITLE = 'BlessBox - QR-Based Registration & Verification System'
const BASE_DESCRIPTION = "Streamline your organization's registration and verification process with QR codes"

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist'
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export function generateMetadata(): Metadata {
  const env = resolveServerEnv()
  const badge = badgeFor(env)
  const prefix = badge ? `[${badge.short}] ` : ''
  return {
    title: {
      template: `${prefix}%s`,
      default: `${prefix}${BASE_TITLE}`,
    },
    description: BASE_DESCRIPTION,
    keywords: 'QR codes, registration, verification, organization management',
    authors: [{ name: 'BlessBox Team' }],
    openGraph: {
      title: `${prefix}${BASE_TITLE}`,
      description: BASE_DESCRIPTION,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${prefix}${BASE_TITLE}`,
      description: BASE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
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
  const showTraklet = process.env.NEXT_PUBLIC_TRAKLET_ENABLED?.trim() === 'true'
  const env = resolveServerEnv()
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans`}>
        <EnvChrome env={env} hostRules={HOST_RULES} />
        <AuthProvider>
          {children}
          <TutorialSystemLoader />
          {showTraklet ? <TrakletDevWidget /> : null}
        </AuthProvider>
      </body>
    </html>
  )
}
