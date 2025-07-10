'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Music, User, LogOut, Search, Plus, DollarSign } from 'lucide-react'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">TuneHire</span>
              <span className="text-sm text-gray-500">by Undertone</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                {session.user.canBuy && (
                  <Link
                    href="/search"
                    className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                  >
                    <Search className="h-5 w-5" />
                    <span>Find Musicians</span>
                  </Link>
                )}
                
                {session.user.canSell && (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                    >
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/payouts"
                      className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
                    >
                      <DollarSign className="h-5 w-5" />
                      <span>Payouts</span>
                    </Link>
                  </>
                )}
                
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                >
                  <Plus className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-purple-600"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}