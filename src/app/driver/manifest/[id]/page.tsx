"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Passenger {
  id: string
  name: string
  phone: string | null
}

interface TripManifest {
  id: string
  date: string
  status: string
  routes: { name: string; origin: string; destination: string; route_stops: { name: string; order: number }[] } | null
  passengers: Passenger[]
}

export default function PassengerManifestPage({ params }: { params: Promise<{ id: string }> }) {
  const [manifest, setManifest] = useState<TripManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [tripId, setTripId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setTripId(id))
  }, [params])

  useEffect(() => {
    if (!tripId) return

    async function fetchManifest() {
      const { data: tripData } = await supabase
        .from("trips")
        .select("*, routes(*, route_stops(*))")
        .eq("id", tripId)
        .single()

      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select("*, employees(*)")
        .eq("route_id", tripData?.routes?.id)
        .eq("status", "active")

      const passengers = subscriptionsData?.map((sub) => ({
        id: sub.employees.id,
        name: sub.employees.name,
        phone: sub.employees.phone,
      })) || []

      setManifest({
        id: tripData.id,
        date: tripData.date,
        status: tripData.status,
        routes: tripData.routes,
        passengers,
      })
      setLoading(false)
    }
    fetchManifest()
  }, [tripId])

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (!manifest) return <div className="text-red-500">Manifest not found</div>

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">{manifest.routes?.name}</h2>
        <p className="text-sm text-gray-500">{manifest.date}</p>
        <p className="text-sm text-gray-600 mt-1">
          {manifest.routes?.origin} → {manifest.routes?.destination}
        </p>
      </div>

      {manifest.routes?.route_stops && manifest.routes.route_stops.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Stops</h3>
          <div className="space-y-2">
            {manifest.routes.route_stops
              .sort((a, b) => a.order - b.order)
              .map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-900">{stop.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Passengers ({manifest.passengers.length})</h3>
        {manifest.passengers.length === 0 ? (
          <p className="text-sm text-gray-500">No passengers assigned</p>
        ) : (
          <div className="space-y-2">
            {manifest.passengers.map((passenger) => (
              <div key={passenger.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{passenger.name}</p>
                  {passenger.phone && <p className="text-xs text-gray-500">{passenger.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
