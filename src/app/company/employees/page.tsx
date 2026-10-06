"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Employee {
  id: string
  name: string
  phone: string | null
  status: string
}

export default function CompanyEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEmployees() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const tenantId = user.app_metadata?.tenant_id ?? ''
      const { data } = await supabase.from("employees").select("*").eq("tenant_id", tenantId).order("name")
      setEmployees(data || [])
      setLoading(false)
    }
    fetchEmployees()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading employees...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
        <p className="text-sm text-gray-500">{employees.length} total employees</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
