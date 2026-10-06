"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface ReportData {
  totalTrips: number
  completedTrips: number
  cancelledTrips: number
  onTimeRate: number
  totalRevenue: number
}

export default function CompanyReportsPage() {
  const [report, setReport] = useState<ReportData>({
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    onTimeRate: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const tenantId = user.app_metadata?.tenant_id ?? ''

      const { data: trips } = await supabase.from("trips").select("status").eq("tenant_id", tenantId)
      const { data: invoices } = await supabase.from("invoices").select("amount").eq("tenant_id", tenantId).eq("status", "paid")

      const totalTrips = trips?.length || 0
      const completedTrips = trips?.filter((t) => t.status === "completed").length || 0
      const cancelledTrips = trips?.filter((t) => t.status === "cancelled").length || 0
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0

      setReport({
        totalTrips,
        completedTrips,
        cancelledTrips,
        onTimeRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
        totalRevenue,
      })
      setLoading(false)
    }
    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500">Operational and financial summary</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Trips</p>
          <p className="text-2xl font-bold text-gray-900">{report.totalTrips}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{report.completedTrips}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{report.cancelledTrips}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">On-Time Rate</p>
          <p className="text-2xl font-bold text-blue-600">{report.onTimeRate}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">${report.totalRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
