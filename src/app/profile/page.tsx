'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Music, Upload, DollarSign, Save, Plus, Edit, Trash2, Check, X, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'

interface Profile {
  id: string
  bio: string
  instrument: string
  pricePerMinute: number
  profileImage: string
  audioSamples: string[]
  isAvailable: boolean
}

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

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [stripeStatus, setStripeStatus] = useState<any>(null)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    instrument: '',
    pricePerMinute: 10,
    isAvailable: true
  })
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    included: [''],
    excluded: [''],
    basePrice: 10,
    creditRequired: '',
    creditInstructions: ''
  })

  const { startUpload: uploadImage } = useUploadThing('profileImage')
  const { startUpload: uploadAudio } = useUploadThing('audioFile')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    if (!session.user.canSell) {
      router.push('/dashboard')
      return
    }
    
    fetchProfile()
    fetchStripeStatus()
    
    // Check for Stripe success/error in URL params
    const stripeSuccess = searchParams.get('stripe_success')
    const stripeError = searchParams.get('stripe_error')
    
    if (stripeSuccess) {
      // Refresh session and check status after successful onboarding
      update()
      fetchStripeStatus()
    }
    
    if (stripeError) {
      console.error('Stripe onboarding error:', stripeError)
    }
  }, [session, searchParams])

  const fetchProfile = async () => {
    try {
      const profileResponse = await fetch('/api/profiles')
      
      if (profileResponse.ok) {
        const profiles = await profileResponse.json()
        const userProfile = profiles.find((p: any) => p.userId === session?.user?.id)
        if (userProfile) {
          setProfile(userProfile)
          setFormData({
            bio: userProfile.bio || '',
            instrument: userProfile.instrument || '',
            pricePerMinute: userProfile.pricePerMinute || 10,
            isAvailable: userProfile.isAvailable
          })
        }
      }

      // Only fetch services if user can sell
      if (session?.user?.canSell) {
        const servicesResponse = await fetch('/api/services')
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          setServices(servicesData)
        } else {
          console.error('Failed to fetch services:', servicesResponse.status)
          setServices([])
        }
      } else {
        setServices([])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status')
      if (response.ok) {
        const status = await response.json()
        setStripeStatus(status)
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
    }
  }

  const handleStripeOnboarding = async () => {
    setConnectingStripe(true)
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error('Failed to create onboarding link')
      }
    } catch (error) {
      console.error('Error starting Stripe onboarding:', error)
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        // Show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const uploadResult = await uploadImage([file])
      if (uploadResult?.[0]?.url) {
        // Update profile image URL
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            profileImage: uploadResult[0].url
          }),
        })

        if (response.ok) {
          fetchProfile()
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const uploadResult = await uploadAudio(files)
      if (uploadResult && uploadResult.length > 0) {
        const audioUrls = uploadResult.map(result => result.url)
        const updatedAudioSamples = [...(profile?.audioSamples || []), ...audioUrls]
        
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            audioSamples: updatedAudioSamples
          }),
        })

        if (response.ok) {
          fetchProfile()
        }
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
    }
  }

  const handleServiceSave = async () => {
    try {
      const method = editingService ? 'PATCH' : 'POST'
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: serviceForm.title,
          description: serviceForm.description,
          included: serviceForm.included.filter(item => item.trim() !== ''),
          excluded: serviceForm.excluded.filter(item => item.trim() !== ''),
          basePrice: serviceForm.basePrice,
          creditRequired: serviceForm.creditRequired,
          creditInstructions: serviceForm.creditInstructions
        }),
      })

      if (response.ok) {
        fetchProfile() // Refresh services
        setShowServiceForm(false)
        setEditingService(null)
        setServiceForm({
          title: '',
          description: '',
          included: [''],
          excluded: [''],
          basePrice: 10,
          creditRequired: '',
          creditInstructions: ''
        })
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      title: service.title,
      description: service.description,
      included: service.included.length > 0 ? service.included : [''],
      excluded: service.excluded.length > 0 ? service.excluded : [''],
      basePrice: service.basePrice,
      creditRequired: service.creditRequired || '',
      creditInstructions: service.creditInstructions || ''
    })
    setShowServiceForm(true)
  }

  const handleServiceDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProfile() // Refresh services
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const updateIncludedItem = (index: number, value: string) => {
    const newIncluded = [...serviceForm.included]
    newIncluded[index] = value
    setServiceForm({ ...serviceForm, included: newIncluded })
  }

  const addIncludedItem = () => {
    setServiceForm({ ...serviceForm, included: [...serviceForm.included, ''] })
  }

  const removeIncludedItem = (index: number) => {
    const newIncluded = serviceForm.included.filter((_, i) => i !== index)
    setServiceForm({ ...serviceForm, included: newIncluded })
  }

  const updateExcludedItem = (index: number, value: string) => {
    const newExcluded = [...serviceForm.excluded]
    newExcluded[index] = value
    setServiceForm({ ...serviceForm, excluded: newExcluded })
  }

  const addExcludedItem = () => {
    setServiceForm({ ...serviceForm, excluded: [...serviceForm.excluded, ''] })
  }

  const removeExcludedItem = (index: number) => {
    const newExcluded = serviceForm.excluded.filter((_, i) => i !== index)
    setServiceForm({ ...serviceForm, excluded: newExcluded })
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Musician Profile</h1>
          <p className="text-gray-600 mt-2">Manage your profile and showcase your talents</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile?.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <Music className="h-16 w-16 text-purple-600" />
                  )}
                </div>
                
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="profileImage"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </label>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Samples</h3>
                
                <div className="space-y-3 mb-4">
                  {profile?.audioSamples?.map((sample, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Sample {index + 1}</p>
                      <audio controls className="w-full">
                        <source src={sample} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ))}
                </div>
                
                <input
                  type="file"
                  id="audioSamples"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <label
                  htmlFor="audioSamples"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio
                </label>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Instrument
                  </label>
                  <input
                    type="text"
                    id="instrument"
                    value={formData.instrument}
                    onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Piano, Guitar, Violin"
                  />
                </div>

                <div>
                  <label htmlFor="pricePerMinute" className="block text-sm font-medium text-gray-700 mb-2">
                    Rate per Minute
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="pricePerMinute"
                      min="1"
                      max="1000"
                      value={formData.pricePerMinute}
                      onChange={(e) => setFormData({ ...formData, pricePerMinute: parseFloat(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={6}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Tell potential clients about your musical background, experience, and style..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                    Available for new orders
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Connect Section - Only show for sellers */}
        {session?.user?.canSell && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Setup</h2>
                <p className="text-sm text-gray-600">Complete your Stripe setup to receive payments</p>
              </div>
            </div>

            {stripeStatus && !stripeStatus.onboardingComplete ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                      Payment Setup Required
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      To receive payments, you need to complete your Stripe account setup. This includes providing tax information (W-9) and bank account details.
                    </p>
                    <button
                      onClick={handleStripeOnboarding}
                      disabled={connectingStripe}
                      className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {connectingStripe ? 'Starting Setup...' : 'Complete Setup'}
                    </button>
                  </div>
                </div>
              </div>
            ) : stripeStatus && stripeStatus.onboardingComplete ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800 mb-2">
                      Payment Setup Complete
                    </h3>
                    <p className="text-sm text-green-700">
                      Your Stripe account is fully set up and you can receive payments. You'll receive 95% of each payment, with 5% going to platform fees.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CreditCard className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Set Up Payments
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect your Stripe account to start receiving payments from buyers.
                    </p>
                    <button
                      onClick={handleStripeOnboarding}
                      disabled={connectingStripe}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {connectingStripe ? 'Starting Setup...' : 'Set Up Payments'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Services Section - Only show for sellers */}
        {session?.user?.canSell && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Services & Offerings</h2>
              <p className="text-sm text-gray-600">Define what you offer and what's included</p>
            </div>
            <button
              onClick={() => {
                setEditingService(null)
                setServiceForm({
                  title: '',
                  description: '',
                  included: [''],
                  excluded: [''],
                  basePrice: 10,
                  creditRequired: '',
                  creditInstructions: ''
                })
                setShowServiceForm(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Service
            </button>
          </div>

          {/* Services List */}
          <div className="space-y-4 mb-6">
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No services added yet. Create your first service offering!</p>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-lg font-semibold text-green-600 mt-2">${service.basePrice}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleServiceEdit(service)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleServiceDelete(service.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {service.included.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">✓ Included:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {service.included.map((item, index) => (
                            <li key={index} className="flex items-center">
                              <Check className="h-3 w-3 text-green-500 mr-2" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {service.excluded.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">✗ Not Included:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {service.excluded.map((item, index) => (
                            <li key={index} className="flex items-center">
                              <X className="h-3 w-3 text-red-500 mr-2" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(service.creditRequired || service.creditInstructions) && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">📝 Credit Requirements</h4>
                      {service.creditRequired && (
                        <p className="text-sm text-yellow-700 mb-1">
                          <strong>Required Credit:</strong> {service.creditRequired}
                        </p>
                      )}
                      {service.creditInstructions && (
                        <p className="text-sm text-yellow-700">
                          <strong>Instructions:</strong> {service.creditInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Service Form Modal */}
          {showServiceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowServiceForm(false)
                      setEditingService(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Piano Recording Session"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your service in detail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={serviceForm.basePrice}
                      onChange={(e) => setServiceForm({ ...serviceForm, basePrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Credit/Attribution
                    </label>
                    <input
                      type="text"
                      value={serviceForm.creditRequired}
                      onChange={(e) => setServiceForm({ ...serviceForm, creditRequired: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., Music by [Your Name]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Instructions
                    </label>
                    <textarea
                      value={serviceForm.creditInstructions}
                      onChange={(e) => setServiceForm({ ...serviceForm, creditInstructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Specify how and where credit should be given (e.g., in video description, album credits, etc.)"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What's Included
                      </label>
                      {serviceForm.included.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateIncludedItem(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Full arrangement, MIDI file"
                          />
                          {serviceForm.included.length > 1 && (
                            <button
                              onClick={() => removeIncludedItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addIncludedItem}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        + Add another item
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What's NOT Included
                      </label>
                      {serviceForm.excluded.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateExcludedItem(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="e.g., Live recording, Sheet music"
                          />
                          {serviceForm.excluded.length > 1 && (
                            <button
                              onClick={() => removeExcludedItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addExcludedItem}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        + Add another exclusion
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowServiceForm(false)
                        setEditingService(null)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleServiceSave}
                      disabled={!serviceForm.title || !serviceForm.basePrice}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {editingService ? 'Update Service' : 'Create Service'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}