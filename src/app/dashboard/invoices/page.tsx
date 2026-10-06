"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string
  created_at: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
      setInvoices(data || [])
      setLoading(false)
    }
    fetchInvoices()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">${invoice.amount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${invoice.status === "paid" ? "bg-green-100 text-green-800" : invoice.status === "overdue" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{invoice.due_date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
