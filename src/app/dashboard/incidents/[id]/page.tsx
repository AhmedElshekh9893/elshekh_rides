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

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [incidentId, setIncidentId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setIncidentId(id))
  }, [params])

  useEffect(() => {
    if (!incidentId) return

    async function fetchIncident() {
      const { data } = await supabase
        .from("incidents")
        .select("*, trips(*, routes(*))")
        .eq("id", incidentId)
        .single()
      setIncident(data)
      setLoading(false)
    }
    fetchIncident()
  }, [incidentId])

  async function resolveIncident() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("incidents").update({
      status: "resolved",
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", incidentId)
    window.location.reload()
  }

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>
  if (!incident) return <div className="text-red-500">Incident not found</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{incident.type.replace(/_/g, " ")}</h2>
            <p className="text-sm text-gray-500">Trip: {incident.trips?.routes?.name} — {incident.trips?.date}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(incident.status)}`}>
              {incident.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {incident.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-sm font-medium text-gray-900">{incident.description}</p>
          </div>
        )}
      </div>

      {incident.status !== "resolved" && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
          <div className="flex gap-2">
            {incident.status === "open" && (
              <button onClick={resolveIncident} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
                Start Resolution
              </button>
            )}
            <button onClick={resolveIncident} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
              Mark Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function getSeverityColor(severity: string) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }
  return colors[severity] || colors.low
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    open: "bg-red-100 text-red-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
  }
  return colors[status] || colors.open
}
