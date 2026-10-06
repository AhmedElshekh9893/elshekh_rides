"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string | null
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single()
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          {profile.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
        <p className="text-sm text-gray-500">{profile.email}</p>
        {profile.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Actions</h3>
        <button className="w-full bg-red-50 text-red-700 py-2 rounded-md text-sm font-medium border border-red-200">
          Logout
        </button>
      </div>
    </div>
  )
}
