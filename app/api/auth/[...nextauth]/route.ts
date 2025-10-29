import NextAuth from 'next-auth'
import { authOptions } from './authOptions'

const { handlers } = NextAuth(authOptions)

export const { GET, POST } = handlers
