"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Vehicle {
  id: string
  plate: string
  type: string
  capacity: number
  status: string
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVehicles() {
      const { data } = await supabase.from("vehicles").select("*").order("plate")
      setVehicles(data || [])
      setLoading(false)
    }
    fetchVehicles()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Vehicles</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{vehicle.plate}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{vehicle.type}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{vehicle.capacity}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${vehicle.status === "available" ? "bg-green-100 text-green-800" : vehicle.status === "in_use" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                    {vehicle.status.replace("_", " ")}
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
