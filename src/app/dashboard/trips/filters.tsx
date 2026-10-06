"use client"

import { useState } from "react"

interface Filters {
  date: string
  route: string
  driver: string
  status: string
}

export function TripFilters({ onFilter }: { onFilter: (filters: Filters) => void }) {
  const [filters, setFilters] = useState<Filters>({
    date: "",
    route: "",
    driver: "",
    status: "",
  })

  function updateFilter(key: keyof Filters, value: string) {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter("date", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Route</label>
          <input
            type="text"
            placeholder="Search route..."
            value={filters.route}
            onChange={(e) => updateFilter("route", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Driver</label>
          <input
            type="text"
            placeholder="Search driver..."
            value={filters.driver}
            onChange={(e) => updateFilter("driver", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="assigned">Assigned</option>
            <option value="ready">Ready</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({ date: "", route: "", driver: "", status: "" })
              onFilter({ date: "", route: "", driver: "", status: "" })
            }}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium border border-gray-300"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
