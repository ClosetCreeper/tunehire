import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'BUYER' | 'SELLER' | 'ADMIN'
      canBuy: boolean
      canSell: boolean
      stripeAccountId?: string | null
      stripeOnboardingComplete: boolean
    }
  }

  interface User {
    role: 'BUYER' | 'SELLER' | 'ADMIN'
    canBuy: boolean
    canSell: boolean
    stripeAccountId?: string | null
    stripeOnboardingComplete: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'BUYER' | 'SELLER' | 'ADMIN'
    canBuy: boolean
    canSell: boolean
    stripeAccountId?: string | null
    stripeOnboardingComplete: boolean
  }
}