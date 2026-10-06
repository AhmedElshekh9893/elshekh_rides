"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Trip {
  id: string
  date: string
  status: string
  routes: { name: string } | null
  started_at: string | null
  completed_at: string | null
}

export default function DriverHistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      const { data } = await supabase
        .from("trips")
        .select("*, routes(*)")
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(20)
      setTrips(data || [])
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Trip History</h2>
        <p className="text-sm text-gray-500">Completed trips</p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No completed trips yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">{trip.routes?.name || "Unknown Route"}</h3>
                <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                  {trip.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Date: {trip.date}</p>
                {trip.started_at && <p>Started: {new Date(trip.started_at).toLocaleTimeString()}</p>}
                {trip.completed_at && <p>Completed: {new Date(trip.completed_at).toLocaleTimeString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
