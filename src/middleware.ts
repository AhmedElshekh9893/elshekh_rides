import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require a session. Anything else is public. */
const PROTECTED_PREFIXES = ['/dashboard', '/driver', '/customer', '/company']

/** Where an unauthenticated visitor is sent. */
const LOGIN_PATH = '/login'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Must call getUser() (not getSession) so the JWT is validated server-side
  // and an expired token is refreshed through the cookie callbacks above.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Already signed in — don't show the login form again.
  if (pathname === LOGIN_PATH && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/driver/:path*',
    '/customer/:path*',
    '/company/:path*',
    '/login',
  ],
}
