import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { isSuperAdminEmail } from '@/lib/auth'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          const role = isSuperAdminEmail(credentials.email) ? 'superadmin' : 'user'
          return {
            id: '1',
            email: credentials.email as string,
            name: 'Test User',
            role,
          } as any
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || (isSuperAdminEmail(user.email) ? 'superadmin' : 'user')
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role || 'user'
      }
      return session
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret',
}
