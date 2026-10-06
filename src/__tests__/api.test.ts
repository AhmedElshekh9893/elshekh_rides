import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * These tests inspect the REAL API route files on disk.
 *
 * The previous version asserted that string literals like '/api/tenants'
 * started with '/api/' - it passed whether or not any route existed, and
 * could not fail when auth was missing. This version reads the actual
 * source and enforces the security invariants that were violated before.
 */

const API_ROOT = join(process.cwd(), 'src', 'app', 'api')

/** Every route.ts under src/app/api, with its path relative to API_ROOT. */
function collectRoutes(dir: string = API_ROOT): { path: string; file: string }[] {
  const out: { path: string; file: string }[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...collectRoutes(full))
    } else if (entry === 'route.ts') {
      const rel = full.slice(API_ROOT.length + 1).replace(/\\/g, '/').replace('/route.ts', '')
      out.push({ path: '/' + rel, file: full })
    }
  }
  return out
}

const ROUTES = collectRoutes()

/** Routes that authenticate via getAuthContext directly (not authorize()). */
const AUTH_ROUTES = ['/auth/login', '/auth/logout', '/auth/me', '/auth/refresh']

const read = (file: string) => readFileSync(file, 'utf8')

const PROTECTED = ROUTES.filter(
  (r) => !AUTH_ROUTES.some((a) => r.path === a || r.path.startsWith(a + '/'))
)

describe('API route inventory', () => {
  it('finds every route file', () => {
    expect(ROUTES.length).toBe(26)
  })

  it('exposes the core resources', () => {
    const paths = ROUTES.map((r) => r.path)
    for (const expected of [
      '/tenants',
      '/users',
      '/employees',
      '/routes',
      '/trips',
      '/trips/[id]/transition',
      '/incidents',
      '/invoices',
      '/vehicles',
      '/subscriptions',
      '/schedules',
    ]) {
      expect(paths, `missing ${expected}`).toContain(expected)
    }
  })
})

/** Splits a route file into its exported handlers. */
function splitHandlers(src: string): { name: string; body: string }[] {
  const re = /export async function (GET|POST|PATCH|DELETE|PUT)\s*\(/g
  const marks: { name: string; at: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) marks.push({ name: m[1], at: m.index })
  return marks.map((mark, i) => ({
    name: mark.name,
    body: src.slice(mark.at, i + 1 < marks.length ? marks[i + 1].at : src.length),
  }))
}

describe('Authentication - EVERY handler in every non-auth route authenticates', () => {
  it('covers all 22 non-auth routes', () => {
    expect(PROTECTED.length).toBe(22)
  })

  const handlers = PROTECTED.flatMap((r) =>
    splitHandlers(read(r.file)).map((h) => ({ path: r.path, handler: h.name, body: h.body }))
  )

  it('finds a meaningful number of handlers', () => {
    expect(handlers.length).toBeGreaterThan(50)
  })

  it.each(handlers.map((h) => `${h.path} ${h.handler}`))('%s authenticates', (label) => {
    const [path, handler] = label.split(' ')
    const h = handlers.find((x) => x.path === path && x.handler === handler)!
    expect(h.body, `${label} has no authorize() call`).toMatch(/authorize\(/)
    expect(h.body, `${label} ignores the authorize() result`).toMatch(
      /if \(!auth\.ok\) return auth\.response/
    )
  })
})

describe('Tenant isolation - writes carry a tenant scope', () => {
  const writeRoutes = ROUTES.filter(
    (r) =>
      !AUTH_ROUTES.some((a) => r.path === a || r.path.startsWith(a + '/')) &&
      /export async function (POST|PATCH)/.test(read(r.file))
  )

  it('finds write routes to check', () => {
    expect(writeRoutes.length).toBeGreaterThan(10)
  })

  it.each(writeRoutes.map((r) => r.path))('%s scopes by tenant', (path) => {
    const src = read(ROUTES.find((r) => r.path === path)!.file)
    expect(src, `${path} does not scope by tenant`).toMatch(/auth\.tenantId/)
  })
})

describe('Constitution VII - no hard delete anywhere', () => {
  it.each(ROUTES.map((r) => r.path))('%s has no .delete() call', (path) => {
    const src = read(ROUTES.find((r) => r.path === path)!.file)
    expect(src, `${path} still performs a hard delete`).not.toMatch(/\.delete\(\)/)
  })
})

describe('Constitution VIII - no service role key in the API layer', () => {
  it.each(ROUTES.map((r) => r.path))('%s avoids the service role key', (path) => {
    const src = read(ROUTES.find((r) => r.path === path)!.file)
    expect(src, `${path} references the service role key`).not.toMatch(/SERVICE_ROLE/)
  })
})

describe('Input validation - writes validate with Zod', () => {
  const postRoutes = ROUTES.filter(
    (r) => !AUTH_ROUTES.includes(r.path) && /export async function POST/.test(read(r.file))
  )

  it.each(postRoutes.map((r) => r.path))('%s validates its body', (path) => {
    const src = read(ROUTES.find((r) => r.path === path)!.file)
    expect(src, `${path} does not use safeParse`).toMatch(/\.safeParse\(/)
  })
})

describe('Authentication - no route reads user_metadata', () => {
  it.each(ROUTES.map((r) => r.path))('%s uses app_metadata only', (path) => {
    const src = read(ROUTES.find((r) => r.path === path)!.file)
    expect(src, `${path} reads user_metadata`).not.toMatch(/user_metadata/)
  })
})
