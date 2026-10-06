"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Trip {
  id: string
  date: string
  status: string
  routes: { name: string; origin: string; destination: string } | null
  drivers: { name: string } | null
  vehicles: { plate: string; type: string } | null
}

export default function CustomerTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
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

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("route_id")
        .eq("employee_id", employeeData.id)
        .eq("status", "active")
        .single()

      if (!subscriptionData) {
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*, routes(*), drivers:users(*), vehicles(*)")
        .eq("route_id", subscriptionData.route_id)
        .eq("date", today)
        .in("status", ["scheduled", "assigned", "ready", "in_progress", "completed"])

      setTrips(tripsData || [])
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
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Trips</h2>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No trips scheduled for today</p>
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
  const statusConfig: Record<string, { color: string; label: string }> = {
    scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled" },
    assigned: { color: "bg-yellow-100 text-yellow-800", label: "Assigned" },
    ready: { color: "bg-purple-100 text-purple-800", label: "Ready" },
    in_progress: { color: "bg-orange-100 text-orange-800", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
  }

  const config = statusConfig[trip.status] || statusConfig.scheduled

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">{trip.routes?.name || "Unknown Route"}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>From: {trip.routes?.origin}</p>
        <p>To: {trip.routes?.destination}</p>
        {trip.drivers && <p>Driver: {trip.drivers.name}</p>}
        {trip.vehicles && <p>Vehicle: {trip.vehicles.plate} ({trip.vehicles.type})</p>}
      </div>
    </div>
  )
}
