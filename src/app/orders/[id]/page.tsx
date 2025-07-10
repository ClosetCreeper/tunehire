'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Music, Clock, DollarSign, MessageSquare, FileText, User, Tag, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  title: string
  tempo: number
  notes: string
  lengthMinutes: number
  totalPrice: number
  sheetMusicUrl: string
  audioFileUrl: string
  intendedUse: string
  usageType: 'PERSONAL' | 'COMMERCIAL' | 'EDUCATIONAL' | 'BROADCAST' | 'STREAMING' | 'LIVE_PERFORMANCE' | 'OTHER'
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  buyer: {
    id: string
    name: string
    email: string
  }
  seller: {
    id: string
    name: string
    email: string
  }
  messages: Array<{
    id: string
    content: string
    createdAt: string
  }>
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

export default function OrderDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrder()
  }, [session])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
        
        // If this is a seller viewing the order, fetch their services to show credit requirements
        if (orderData.seller.id === session?.user?.id) {
          const servicesResponse = await fetch('/api/services')
          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json()
            setServices(servicesData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUsageTypeLabel = (usageType: string) => {
    switch (usageType) {
      case 'PERSONAL':
        return 'Personal Use'
      case 'COMMERCIAL':
        return 'Commercial Use'
      case 'EDUCATIONAL':
        return 'Educational Use'
      case 'BROADCAST':
        return 'Broadcast/TV/Radio'
      case 'STREAMING':
        return 'Streaming Platforms'
      case 'LIVE_PERFORMANCE':
        return 'Live Performance'
      case 'OTHER':
        return 'Other'
      default:
        return usageType
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
          </div>
        </div>
      </div>
    )
  }

  const isSeller = order.seller.id === session?.user?.id
  const relevantServices = services.filter(service => 
    service.creditRequired || service.creditInstructions
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
              <p className="text-gray-600 mt-2">
                {isSeller ? `Order from ${order.buyer.name}` : `Order with ${order.seller.name}`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Specifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.lengthMinutes} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Music className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.tempo} BPM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">${order.totalPrice}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.messages.length} messages</span>
                </div>
              </div>

              {order.notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}

              {order.sheetMusicUrl && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sheet Music</h3>
                  <a
                    href={order.sheetMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Sheet Music
                  </a>
                </div>
              )}

              {order.audioFileUrl && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Audio File</h3>
                  <a
                    href={order.audioFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-700"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Download Audio
                  </a>
                </div>
              )}
            </div>

            {/* Usage Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Usage Type</h3>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-900 font-medium">
                      {getUsageTypeLabel(order.usageType)}
                    </span>
                  </div>
                </div>

                {order.intendedUse && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Intended Use Description</h3>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {order.intendedUse}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Requirements (for sellers) */}
            {isSeller && relevantServices.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h2 className="text-xl font-semibold text-yellow-800">Credit Requirements</h2>
                </div>
                
                <div className="space-y-4">
                  {relevantServices.map((service) => (
                    <div key={service.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                      <h3 className="font-medium text-gray-900 mb-2">{service.title}</h3>
                      
                      {service.creditRequired && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-700">
                            <strong>Required Credit:</strong> {service.creditRequired}
                          </p>
                        </div>
                      )}
                      
                      {service.creditInstructions && (
                        <div>
                          <p className="text-sm text-gray-700">
                            <strong>Instructions:</strong> {service.creditInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Reminder:</strong> Make sure to communicate these credit requirements to the buyer when delivering the final work.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Buyer</p>
                    <p className="text-sm text-gray-600">{order.buyer.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Music className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Musician</p>
                    <p className="text-sm text-gray-600">{order.seller.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {order.status !== 'PENDING' && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Updated</p>
                      <p className="text-xs text-gray-500">
                        Current status: {order.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}