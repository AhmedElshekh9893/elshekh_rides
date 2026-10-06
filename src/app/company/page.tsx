"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface CompanyStats {
  totalEmployees: number
  activeSubscriptions: number
  totalTrips: number
  completedTrips: number
}

export default function CompanyOverviewPage() {
  const [stats, setStats] = useState<CompanyStats>({
    totalEmployees: 0,
    activeSubscriptions: 0,
    totalTrips: 0,
    completedTrips: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const tenantId = user.app_metadata?.tenant_id ?? ''

      const { data: employees } = await supabase.from("employees").select("id").eq("tenant_id", tenantId)
      const { data: subscriptions } = await supabase.from("subscriptions").select("id").eq("tenant_id", tenantId).eq("status", "active")
      const { data: trips } = await supabase.from("trips").select("id, status").eq("tenant_id", tenantId)

      setStats({
        totalEmployees: employees?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalTrips: trips?.length || 0,
        completedTrips: trips?.filter((t) => t.status === "completed").length || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Company Overview</h2>
        <p className="text-sm text-gray-500">Your transportation at a glance</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Employees" value={stats.totalEmployees} color="blue" />
        <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} color="green" />
        <StatCard label="Total Trips" value={stats.totalTrips} color="purple" />
        <StatCard label="Completed Trips" value={stats.completedTrips} color="orange" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
