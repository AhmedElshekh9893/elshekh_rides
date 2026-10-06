"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Subscription {
  id: string
  start_date: string
  end_date: string
  price: number
  status: string
  routes: { name: string; origin: string; destination: string } | null
}

export default function CustomerSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: employeeData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!employeeData) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("subscriptions")
        .select("*, routes(*)")
        .eq("employee_id", employeeData.id)
        .eq("status", "active")
        .single()

      setSubscription(data)
      setLoading(false)
    }
    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading subscription...</p>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No active subscription</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">My Subscription</h2>
        <p className="text-sm text-gray-500">Active subscription details</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500">Route</p>
          <p className="text-sm font-medium text-gray-900">{subscription.routes?.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">From</p>
          <p className="text-sm font-medium text-gray-900">{subscription.routes?.origin}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">To</p>
          <p className="text-sm font-medium text-gray-900">{subscription.routes?.destination}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Period</p>
          <p className="text-sm font-medium text-gray-900">{subscription.start_date} → {subscription.end_date}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-sm font-medium text-gray-900">${subscription.price}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
            {subscription.status}
          </span>
        </div>
      </div>
    </div>
  )
}
