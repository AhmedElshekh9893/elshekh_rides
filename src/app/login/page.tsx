'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

/**
 * useSearchParams() forces client-side rendering, so the form lives in its own
 * component behind a Suspense boundary. Without this, the static prerender of
 * /login fails the build.
 */
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Login failed')
      setLoading(false)
      return
    }

    // Route by role so each surface lands on its own home.
    const role = (data.user.app_metadata?.role as string) ?? ''
    const next = searchParams.get('next')
    const home =
      next ??
      (role === 'driver'
        ? '/driver'
        : role === 'customer'
          ? '/customer'
          : role === 'company_admin'
            ? '/company'
            : '/dashboard')

    router.push(home)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ELSHEKH RIDES</h1>
          <p className="text-sm text-gray-500 mt-1">
            B2B Corporate Transportation Management
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
              Loading...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
