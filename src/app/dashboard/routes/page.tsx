"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Route {
  id: string
  name: string
  origin: string
  destination: string
  distance_km: number | null
  status: string
  route_stops: { name: string; order: number }[]
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRoutes() {
      const { data } = await supabase.from("routes").select("*, route_stops(*)").order("name")
      setRoutes(data || [])
      setLoading(false)
    }
    fetchRoutes()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Routes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stops</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{route.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{route.origin}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{route.destination}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{route.distance_km ? `${route.distance_km} km` : "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{route.route_stops?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${route.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {route.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
