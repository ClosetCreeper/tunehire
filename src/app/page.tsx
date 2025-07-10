'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Search, Music, Users, Star, ArrowRight } from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/search?instrument=${encodeURIComponent(searchTerm)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main>
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Hire Musicians to Record
                <span className="block text-yellow-300">Custom Music</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Connect with talented musicians worldwide. Upload sheet music, set your tempo, and receive professional recordings.
              </p>
              
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search for musicians by instrument..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-6 py-4 text-lg text-gray-900 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-yellow-500 text-gray-900 font-semibold rounded-r-lg hover:bg-yellow-400 transition-colors"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                </div>
              </form>
              
              <div className="space-x-4">
                <Link
                  href="/search"
                  className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Find Musicians
                </Link>
                {!session && (
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-colors"
                  >
                    <Music className="h-5 w-5 mr-2" />
                    Join as Musician
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How TuneHire Works
              </h2>
              <p className="text-xl text-gray-600">
                Simple steps to get your custom music recorded
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Find Musicians</h3>
                <p className="text-gray-600">
                  Browse our network of talented musicians by instrument type and listen to their samples.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Music className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Submit Your Request</h3>
                <p className="text-gray-600">
                  Upload sheet music, set tempo and notes, pay securely, and wait for your custom recording.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Receive & Review</h3>
                <p className="text-gray-600">
                  Download your professionally recorded music and leave a review for the musician.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-900 text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  For Musicians
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Showcase your talent, set your rates, and earn money recording custom music for clients worldwide.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-yellow-400 mr-3" />
                    <span>Set your own rates per minute</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-yellow-400 mr-3" />
                    <span>Upload audio samples to showcase your skills</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-yellow-400 mr-3" />
                    <span>Manage your availability and orders</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-5 w-5 text-yellow-400 mr-3" />
                    <span>Build your reputation with reviews</span>
                  </li>
                </ul>
                {!session && (
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-4 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Start Earning
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                )}
              </div>
              
              <div className="bg-gray-800 rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Featured Musicians</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <Music className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Johnson</p>
                      <p className="text-gray-400">Violin • $15/min</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Music className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Mike Chen</p>
                      <p className="text-gray-400">Piano • $12/min</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Music className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Emma Rodriguez</p>
                      <p className="text-gray-400">Guitar • $10/min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
