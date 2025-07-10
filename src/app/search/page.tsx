'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Search, Music, Star, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  title: string
  description: string
  included: string[]
  excluded: string[]
  basePrice: number
  creditRequired: string
  creditInstructions: string
  isActive: boolean
}

interface Profile {
  id: string
  bio: string
  instrument: string
  pricePerMinute: number
  profileImage: string
  audioSamples: string[]
  isAvailable: boolean
  services: Service[]
  user: {
    id: string
    name: string
    email: string
    image: string
  }
}

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const instrument = searchParams.get('instrument') || ''
    setSearchTerm(instrument)
    fetchProfiles(instrument)
  }, [searchParams])

  const fetchProfiles = async (instrument: string = '') => {
    try {
      const url = `/api/profiles${instrument ? `?instrument=${encodeURIComponent(instrument)}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProfiles(data)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProfiles(searchTerm)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Musicians</h1>
          
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex">
              <input
                type="text"
                placeholder="Search by instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No musicians found</h3>
            <p className="text-gray-600">Try searching for a different instrument or check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.user.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <Music className="h-8 w-8 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{profile.user.name}</h3>
                      <p className="text-purple-600 font-medium">{profile.instrument}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{profile.bio}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        ${profile.pricePerMinute}/min
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={`text-sm ${profile.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {profile.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </div>
                  </div>
                  
                  {profile.audioSamples.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Audio Samples</h4>
                      <div className="space-y-2">
                        {profile.audioSamples.slice(0, 2).map((sample, index) => (
                          <audio
                            key={index}
                            controls
                            className="w-full h-8"
                            src={sample}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile.services.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Services Offered</h4>
                      <div className="space-y-2">
                        {profile.services.slice(0, 2).map((service) => (
                          <div key={service.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="text-sm font-medium text-gray-900">{service.title}</h5>
                              <span className="text-sm font-semibold text-green-600">${service.basePrice}</span>
                            </div>
                            {service.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">{service.description}</p>
                            )}
                            {service.included.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-green-700">
                                  ✓ {service.included.slice(0, 2).join(', ')}
                                  {service.included.length > 2 && '...'}
                                </p>
                              </div>
                            )}
                            {service.creditRequired && (
                              <div className="mt-1">
                                <p className="text-xs text-yellow-700">
                                  📝 Credit: {service.creditRequired}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                        {profile.services.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{profile.services.length - 2} more services
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link
                    href={`/hire/${profile.user.id}`}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                      profile.isAvailable
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {profile.isAvailable ? 'Hire Musician' : 'Currently Unavailable'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}