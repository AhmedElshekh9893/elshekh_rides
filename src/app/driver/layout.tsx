"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/driver", label: "Today's Trips" },
  { href: "/driver/history", label: "History" },
  { href: "/driver/profile", label: "Profile" },
]

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">ELSHEKH Driver</h1>
          <p className="text-xs text-gray-500">Trip Execution</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium">
          D
        </div>
      </header>

      <main className="pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1 rounded-md text-xs font-medium ${
                pathname === item.href
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
