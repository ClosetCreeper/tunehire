'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface PayoutStats {
  totalEarnings: number
  platformFees: number
  netEarnings: number
  totalPaidOut: number
  pendingPayouts: number
  availableForPayout: number
  completedOrdersCount: number
  unpaidOrdersCount: number
}

interface Payout {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
  orderIds: string[]
  createdAt: string
}

export default function PayoutsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<PayoutStats | null>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    if (!session.user.canSell) {
      router.push('/dashboard')
      return
    }
    
    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      const [statsResponse, payoutsResponse] = await Promise.all([
        fetch('/api/payouts/stats'),
        fetch('/api/payouts')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json()
        setPayouts(payoutsData)
      }
    } catch (error) {
      console.error('Error fetching payout data:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    setRequesting(true)
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to request payout')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      alert('Failed to request payout')
    } finally {
      setRequesting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'PROCESSING':
        return <AlertCircle className="h-4 w-4" />
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600 mt-2">Track your earnings and manage payouts</p>
        </div>

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Earnings
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${stats.totalEarnings.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Net Earnings
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${stats.netEarnings.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Paid Out
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${stats.totalPaidOut.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${stats.availableForPayout.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Request Section */}
            {stats.availableForPayout > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Request Payout</h3>
                    <p className="text-sm text-gray-600">
                      You have ${stats.availableForPayout.toFixed(2)} available from {stats.unpaidOrdersCount} completed orders
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Platform fee (10%): ${(stats.availableForPayout / 0.9 * 0.1).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={requestPayout}
                    disabled={requesting}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {requesting ? 'Requesting...' : 'Request Payout'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Payouts History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payout History</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {payouts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No payouts yet
              </div>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(payout.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${payout.amount.toFixed(2)} {payout.currency.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payout.orderIds.length} orders • {new Date(payout.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}