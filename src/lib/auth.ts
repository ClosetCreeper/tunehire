import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user) return null
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ''
        )
        
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          canBuy: user.canBuy,
          canSell: user.canSell,
          stripeAccountId: user.stripeAccountId,
          stripeOnboardingComplete: user.stripeOnboardingComplete,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.canBuy = user.canBuy
        token.canSell = user.canSell
        token.stripeAccountId = user.stripeAccountId
        token.stripeOnboardingComplete = user.stripeOnboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.canBuy = token.canBuy
        session.user.canSell = token.canSell
        session.user.stripeAccountId = token.stripeAccountId
        session.user.stripeOnboardingComplete = token.stripeOnboardingComplete
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    //signUp: '/auth/signup',
  },
}