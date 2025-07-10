'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Music, Upload, DollarSign, Clock, Star, AlertCircle } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'

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

export default function HirePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    tempo: 120,
    notes: '',
    lengthMinutes: 1,
    sheetMusicFile: null as File | null,
    intendedUse: '',
    usageType: 'PERSONAL' as 'PERSONAL' | 'COMMERCIAL' | 'EDUCATIONAL' | 'BROADCAST' | 'STREAMING' | 'LIVE_PERFORMANCE' | 'OTHER'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sheetMusicUrl, setSheetMusicUrl] = useState('')

  const { startUpload } = useUploadThing('sheetMusic')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchProfile()
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profiles`)
      if (response.ok) {
        const profiles = await response.json()
        const targetProfile = profiles.find((p: Profile) => p.user.id === params.id)
        setProfile(targetProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, sheetMusicFile: file })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !session) return

    setIsSubmitting(true)

    try {
      let uploadedUrl = ''
      
      if (formData.sheetMusicFile) {
        const uploadResult = await startUpload([formData.sheetMusicFile])
        if (uploadResult?.[0]?.url) {
          uploadedUrl = uploadResult[0].url
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: profile.user.id,
          title: formData.title,
          tempo: formData.tempo,
          notes: formData.notes,
          lengthMinutes: formData.lengthMinutes,
          sheetMusicUrl: uploadedUrl,
          intendedUse: formData.intendedUse,
          usageType: formData.usageType
        }),
      })

      if (response.ok) {
        const order = await response.json()
        router.push(`/orders/${order.id}`)
      } else {
        console.error('Error creating order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
    } finally {
      setIsSubmitting(false)
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Musician not found</h1>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = formData.lengthMinutes * profile.pricePerMinute

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.user.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <Music className="h-10 w-10 text-purple-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
                <p className="text-purple-600 font-medium text-lg">{profile.instrument}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    ${profile.pricePerMinute}/min
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600">{profile.bio}</p>
            </div>
            
            {profile.audioSamples.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Samples</h3>
                <div className="space-y-3">
                  {profile.audioSamples.map((sample, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Sample {index + 1}</p>
                      <audio
                        controls
                        className="w-full"
                        src={sample}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Requirements */}
            {profile.services && profile.services.some(s => s.creditRequired || s.creditInstructions) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Requirements</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm font-medium text-yellow-800">
                      Please note the following credit requirements for this musician's work:
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {profile.services
                      .filter(service => service.creditRequired || service.creditInstructions)
                      .map((service) => (
                        <div key={service.id} className="bg-white rounded-lg p-3 border border-yellow-300">
                          <h4 className="font-medium text-gray-900 mb-2">{service.title}</h4>
                          
                          {service.creditRequired && (
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Required Credit:</strong> {service.creditRequired}
                            </p>
                          )}
                          
                          {service.creditInstructions && (
                            <p className="text-sm text-gray-700">
                              <strong>Instructions:</strong> {service.creditInstructions}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Place Your Order</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Track Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Wedding Theme Song"
                />
              </div>

              <div>
                <label htmlFor="tempo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  id="tempo"
                  min="40"
                  max="200"
                  required
                  value={formData.tempo}
                  onChange={(e) => setFormData({ ...formData, tempo: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="lengthMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                  Length (Minutes)
                </label>
                <input
                  type="number"
                  id="lengthMinutes"
                  min="0.5"
                  max="10"
                  step="0.5"
                  required
                  value={formData.lengthMinutes}
                  onChange={(e) => setFormData({ ...formData, lengthMinutes: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="sheetMusic" className="block text-sm font-medium text-gray-700 mb-2">
                  Sheet Music (PDF)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="sheetMusic"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="sheetMusic"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formData.sheetMusicFile ? formData.sheetMusicFile.name : 'Click to upload PDF'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="usageType" className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="usageType"
                  required
                  value={formData.usageType}
                  onChange={(e) => setFormData({ ...formData, usageType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="PERSONAL">Personal Use</option>
                  <option value="COMMERCIAL">Commercial Use</option>
                  <option value="EDUCATIONAL">Educational Use</option>
                  <option value="BROADCAST">Broadcast/TV/Radio</option>
                  <option value="STREAMING">Streaming Platforms</option>
                  <option value="LIVE_PERFORMANCE">Live Performance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700 mb-2">
                  Intended Use Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="intendedUse"
                  rows={3}
                  required
                  value={formData.intendedUse}
                  onChange={(e) => setFormData({ ...formData, intendedUse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe how you plan to use this music (e.g., background music for YouTube video, wedding ceremony, podcast intro, etc.)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about your intended use. This helps the musician understand your needs and any licensing requirements.
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Any specific instructions or style preferences..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Duration:</span>
                  <span>{formData.lengthMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Rate:</span>
                  <span>${profile.pricePerMinute}/min</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !profile.isAvailable}
                className="w-full py-3 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Order...' : `Place Order - $${totalPrice.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}