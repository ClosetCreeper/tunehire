'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Music, Clock, DollarSign, MessageSquare, Star, Search, TrendingUp, Tag } from 'lucide-react'
import Link from 'next/link'

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
  sellerId: string
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

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [enablingSelling, setEnablingSelling] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsageTypeLabel = (usageType: string) => {
    switch (usageType) {
      case 'PERSONAL':
        return 'Personal'
      case 'COMMERCIAL':
        return 'Commercial'
      case 'EDUCATIONAL':
        return 'Educational'
      case 'BROADCAST':
        return 'Broadcast'
      case 'STREAMING':
        return 'Streaming'
      case 'LIVE_PERFORMANCE':
        return 'Live Performance'
      case 'OTHER':
        return 'Other'
      default:
        return usageType
    }
  }

  const enableSelling = async () => {
    setEnablingSelling(true)
    try {
      const response = await fetch('/api/users/capabilities', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canSell: true }),
      })

      if (response.ok) {
        // Refresh the session to update the user data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error enabling selling:', error)
    } finally {
      setEnablingSelling(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your orders and track progress</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            {session?.user?.canSell && (
              <>
                <Link
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Music className="h-5 w-5 mr-2" />
                  Manage Profile
                </Link>
                <Link
                  href="/payouts"
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Earnings
                </Link>
              </>
            )}
            {session?.user?.canBuy && (
              <Link
                href="/search"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Search className="h-5 w-5 mr-2" />
                Find Musicians
              </Link>
            )}
          </div>
          
          {!session?.user?.canSell && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Become a Seller</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Start offering your musical services to earn money
                  </p>
                </div>
                <button
                  onClick={enableSelling}
                  disabled={enablingSelling}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {enablingSelling ? 'Enabling...' : 'Enable Selling'}
                </button>
              </div>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">
              {session?.user?.canBuy && session?.user?.canSell 
                ? 'You can both hire musicians and accept orders from clients.' 
                : session?.user?.canSell 
                ? 'Wait for clients to place orders with you.' 
                : 'Start by finding musicians to hire.'}
            </p>
            {session?.user?.canBuy && (
              <Link
                href="/search"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Find Musicians
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{order.title}</h3>
                    <p className="text-gray-600">
                      {order.sellerId === session?.user?.id
                        ? `Order from ${order.buyer.name}` 
                        : `Order with ${order.seller.name}`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.lengthMinutes} min</span>
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

                {order.usageType && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Usage: {getUsageTypeLabel(order.usageType)}</span>
                    </div>
                    {order.intendedUse && (
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                        {order.intendedUse}
                      </p>
                    )}
                  </div>
                )}
                
                {order.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Created {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <div className="space-x-2">
                    {order.sheetMusicUrl && (
                      <a
                        href={order.sheetMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        View Sheet Music
                      </a>
                    )}
                    {order.audioFileUrl && (
                      <a
                        href={order.audioFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        Download Audio
                      </a>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}