"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface DashboardStats {
  scheduled: number
  inProgress: number
  completed: number
  delayed: number
  unassigned: number
  driverIssues: number
  vehicleIssues: number
  onTimeRate: number
}

export default function OperationsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    unassigned: 0,
    driverIssues: 0,
    vehicleIssues: 0,
    onTimeRate: 0,
  })
  const [exceptions, setExceptions] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const today = new Date().toISOString().split("T")[0]

      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("date", today)

      const { data: incidents } = await supabase
        .from("incidents")
        .select("*, trips(*, routes(*))")
        .eq("status", "open")

      if (trips) {
        setStats({
          scheduled: trips.filter((t) => t.status === "scheduled").length,
          inProgress: trips.filter((t) => t.status === "in_progress").length,
          completed: trips.filter((t) => t.status === "completed").length,
          delayed: trips.filter((t) => t.status === "in_progress" && new Date(t.started_at) < new Date(Date.now() - 15 * 60000)).length,
          unassigned: trips.filter((t) => t.status === "scheduled" && !t.driver_id).length,
          driverIssues: incidents?.filter((i) => i.type === "driver_absent").length || 0,
          vehicleIssues: incidents?.filter((i) => i.type === "vehicle_breakdown").length || 0,
          onTimeRate: trips.length > 0
            ? Math.round((trips.filter((t) => t.status === "completed").length / trips.length) * 100)
            : 0,
        })
      }

      setExceptions(incidents || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Scheduled" value={stats.scheduled} color="blue" />
        <StatCard label="In Progress" value={stats.inProgress} color="yellow" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="On-Time Rate" value={`${stats.onTimeRate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Delayed" value={stats.delayed} color="red" />
        <StatCard label="Unassigned" value={stats.unassigned} color="orange" />
        <StatCard label="Open Issues" value={stats.driverIssues + stats.vehicleIssues} color="red" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exceptions</h2>
        </div>
        <div className="p-4">
          {exceptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No open exceptions</p>
          ) : (
            <div className="space-y-3">
              {exceptions.map((incident, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-900">{(incident as Record<string, unknown>).type as string}</p>
                    <p className="text-xs text-red-700">{(incident as Record<string, unknown>).description as string}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                    {(incident as Record<string, unknown>).severity as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    red: "bg-red-50 border-red-200 text-red-900",
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
