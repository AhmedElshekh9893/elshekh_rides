"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Trip {
  id: string
  date: string
  status: string
  driver_id: string | null
  vehicle_id: string | null
  routes: { name: string; origin: string; destination: string } | null
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
      const { data } = await supabase
        .from("trips")
        .select("*, routes(*)")
        .order("date", { ascending: false })
        .limit(50)
      setTrips(data || [])
      setLoading(false)
    }
    fetchTrips()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Trips</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{trip.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{trip.routes?.name || "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={trip.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{trip.driver_id ? "Assigned" : "Unassigned"}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{trip.vehicle_id ? "Assigned" : "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    assigned: "bg-yellow-100 text-yellow-800",
    ready: "bg-purple-100 text-purple-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.draft}`}>
      {status.replace("_", " ")}
    </span>
  )
}
