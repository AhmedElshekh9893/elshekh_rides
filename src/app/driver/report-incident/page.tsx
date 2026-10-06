"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ReportIncidentPage() {
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function submitIncident() {
    if (!type || !description) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    const { data: tripData } = await supabase
      .from("trips")
      .select("id")
      .eq("driver_id", user.id)
      .in("status", ["assigned", "ready", "in_progress"])
      .order("date", { ascending: false })
      .limit(1)
      .single()

    if (!tripData) {
      alert("No active trip found")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("incidents").insert({
      trip_id: tripData.id,
      type,
      severity,
      description,
    })

    setSubmitting(false)

    if (error) {
      alert("Failed to report incident")
    } else {
      setSuccess(true)
      setType("")
      setDescription("")
      setSeverity("medium")
    }
  }

  if (success) {
    return (
      <div className="p-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Incident Reported</h2>
          <p className="text-sm text-green-700">Operations team has been notified</p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium"
          >
            Report Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Report Incident</h2>
        <p className="text-sm text-gray-500">Report a problem with your current trip</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select type...</option>
            <option value="driver_absent">Driver Absent</option>
            <option value="vehicle_breakdown">Vehicle Breakdown</option>
            <option value="delay">Delay</option>
            <option value="no_show">No Show</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Describe the incident..."
          />
        </div>

        <button
          onClick={submitIncident}
          disabled={!type || !description || submitting}
          className="w-full bg-red-600 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Incident"}
        </button>
      </div>
    </div>
  )
}
