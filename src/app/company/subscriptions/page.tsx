"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Subscription {
  id: string
  start_date: string
  end_date: string
  price: number
  status: string
  employees: { name: string } | null
  routes: { name: string } | null
}

export default function CompanySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscriptions() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const tenantId = user.app_metadata?.tenant_id ?? ''
      const { data } = await supabase
        .from("subscriptions")
        .select("*, employees(*), routes(*)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      setSubscriptions(data || [])
      setLoading(false)
    }
    fetchSubscriptions()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Subscriptions</h2>
        <p className="text-sm text-gray-500">{subscriptions.length} total subscriptions</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.employees?.name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sub.routes?.name || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sub.start_date} → {sub.end_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">${sub.price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${sub.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
