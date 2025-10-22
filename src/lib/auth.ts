import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { db } from './database/connection'
import { users, organizations, userOrganizations } from './database/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_USER,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        loginCode: { label: 'Login Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Handle passwordless login with code
        if (credentials.loginCode) {
          // Verify login code logic here
          // This would check against the loginCodes table
          return null // Implement login code verification
        }

        // Handle password login
        if (credentials.password) {
          try {
            // Find user by email
            const user = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1)
            
            if (user.length === 0) return null

            // For organizations, check password
            const org = await db.select().from(organizations).where(eq(organizations.contactEmail, credentials.email as string)).limit(1)
            
            if (org.length > 0) {
              const isValid = await bcrypt.compare(credentials.password as string, org[0].passwordHash || '')
              if (isValid) {
                return {
                  id: org[0].id,
                  email: org[0].contactEmail,
                  name: org[0].name,
                  type: 'organization'
                }
              }
            }

            return null
          } catch (error) {
            console.error('Auth error:', error)
            return null
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.userType = (user as any).type || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string
        session.user.type = token.userType as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

