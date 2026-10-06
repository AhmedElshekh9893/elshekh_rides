"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Operations" },
  { href: "/dashboard/trips", label: "Trips" },
  { href: "/dashboard/routes", label: "Routes" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/vehicles", label: "Vehicles" },
  { href: "/dashboard/incidents", label: "Incidents" },
  { href: "/dashboard/companies", label: "Companies" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/invoices", label: "Invoices" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ELSHEKH</h1>
          <p className="text-xs text-gray-500">Operations Platform</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700">Operations Manager</span>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              OM
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
