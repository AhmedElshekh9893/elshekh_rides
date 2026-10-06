"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Trip {
  id: string
  date: string
  status: string
  routes: { name: string; origin: string; destination: string } | null
  vehicles: { plate: string; type: string } | null
}

export default function DriverTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
      const today = new Date().toISOString().split("T")[0]
      const { data } = await supabase
        .from("trips")
        .select("*, routes(*), vehicles(*)")
        .eq("date", today)
        .in("status", ["assigned", "ready", "in_progress"])
        .order("date")
      setTrips(data || [])
      setLoading(false)
    }
    fetchTrips()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading trips...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Today's Trips</h2>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No trips assigned for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const statusColors: Record<string, string> = {
    assigned: "bg-yellow-100 text-yellow-800",
    ready: "bg-purple-100 text-purple-800",
    in_progress: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{trip.routes?.name || "Unknown Route"}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[trip.status] || "bg-gray-100 text-gray-800"}`}>
          {trip.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>From: {trip.routes?.origin}</p>
        <p>To: {trip.routes?.destination}</p>
        {trip.vehicles && <p>Vehicle: {trip.vehicles.plate} ({trip.vehicles.type})</p>}
      </div>
      <div className="mt-3 flex gap-2">
        {trip.status === "assigned" && (
          <button className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-medium">
            Confirm
          </button>
        )}
        {trip.status === "ready" && (
          <button className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium">
            Start Trip
          </button>
        )}
        {trip.status === "in_progress" && (
          <button className="flex-1 bg-gray-600 text-white py-2 rounded-md text-sm font-medium">
            Complete
          </button>
        )}
      </div>
    </div>
  )
}
