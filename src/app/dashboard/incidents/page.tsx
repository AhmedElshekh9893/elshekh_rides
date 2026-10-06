"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Incident {
  id: string
  type: string
  severity: string
  status: string
  description: string | null
  trips: { id: string; date: string; routes: { name: string } | null } | null
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIncidents() {
      const { data } = await supabase
        .from("incidents")
        .select("*, trips(*, routes(*))")
        .order("created_at", { ascending: false })
        .limit(50)
      setIncidents(data || [])
      setLoading(false)
    }
    fetchIncidents()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Incidents</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {incidents.map((incident) => (
              <tr key={incident.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{incident.type.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{incident.trips?.routes?.name || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${incident.severity === "critical" ? "bg-red-100 text-red-800" : incident.severity === "high" ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${incident.status === "resolved" ? "bg-green-100 text-green-800" : incident.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                    {incident.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{incident.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
