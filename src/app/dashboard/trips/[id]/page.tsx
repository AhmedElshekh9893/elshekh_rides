"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface TripDetail {
  id: string
  date: string
  status: string
  driver_id: string | null
  vehicle_id: string | null
  started_at: string | null
  completed_at: string | null
  routes: { name: string; origin: string; destination: string } | null
  drivers: { id: string; name: string } | null
  vehicles: { id: string; plate: string; type: string } | null
}

interface Driver {
  id: string
  name: string
}

interface Vehicle {
  id: string
  plate: string
  type: string
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [tripId, setTripId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setTripId(id))
  }, [params])

  useEffect(() => {
    if (!tripId) return

    async function fetchData() {
      const { data: tripData } = await supabase
        .from("trips")
        .select("*, routes(*), drivers:users(*), vehicles(*)")
        .eq("id", tripId)
        .single()
      setTrip(tripData)

      const { data: driversData } = await supabase.from("users").select("id, name").eq("role", "driver").eq("status", "active")
      setDrivers(driversData || [])

      const { data: vehiclesData } = await supabase.from("vehicles").select("id, plate, type").eq("status", "available")
      setVehicles(vehiclesData || [])

      setLoading(false)
    }
    fetchData()
  }, [tripId])

  async function assignDriver(driverId: string) {
    await supabase.from("trips").update({ driver_id: driverId }).eq("id", tripId)
    window.location.reload()
  }

  async function assignVehicle(vehicleId: string) {
    await supabase.from("trips").update({ vehicle_id: vehicleId }).eq("id", tripId)
    window.location.reload()
  }

  async function transition(action: string) {
    await supabase.from("trips").update({ status: action }).eq("id", tripId)
    window.location.reload()
  }

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (!trip) return <div className="text-red-500">Trip not found</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{trip.routes?.name}</h2>
            <p className="text-sm text-gray-500">{trip.date}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(trip.status)}`}>
            {trip.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">From</p>
            <p className="font-medium">{trip.routes?.origin}</p>
          </div>
          <div>
            <p className="text-gray-500">To</p>
            <p className="font-medium">{trip.routes?.destination}</p>
          </div>
          <div>
            <p className="text-gray-500">Driver</p>
            <p className="font-medium">{trip.drivers?.name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-gray-500">Vehicle</p>
            <p className="font-medium">{trip.vehicles?.plate || "Unassigned"}</p>
          </div>
          {trip.started_at && (
            <div>
              <p className="text-gray-500">Started</p>
              <p className="font-medium">{new Date(trip.started_at).toLocaleTimeString()}</p>
            </div>
          )}
          {trip.completed_at && (
            <div>
              <p className="text-gray-500">Completed</p>
              <p className="font-medium">{new Date(trip.completed_at).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign Driver</h3>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => e.target.value && assignDriver(e.target.value)}
            defaultValue=""
          >
            <option value="">Select driver...</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assign Vehicle</h3>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => e.target.value && assignVehicle(e.target.value)}
            defaultValue=""
          >
            <option value="">Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate} ({v.type})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
        <div className="flex gap-2">
          {trip.status === "scheduled" && (
            <button onClick={() => transition("assigned")} className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium">
              Mark Assigned
            </button>
          )}
          {trip.status === "assigned" && (
            <button onClick={() => transition("ready")} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium">
              Mark Ready
            </button>
          )}
          {trip.status === "ready" && (
            <button onClick={() => transition("in_progress")} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
              Start Trip
            </button>
          )}
          {trip.status === "in_progress" && (
            <button onClick={() => transition("completed")} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
              Complete
            </button>
          )}
          {["scheduled", "assigned", "ready"].includes(trip.status) && (
            <button onClick={() => transition("cancelled")} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
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
  return colors[status] || colors.draft
}
