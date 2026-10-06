export interface AuthUser {
  id: string
  email: string
  role: string
  tenantId: string
}

export interface AuthProvider {
  login(email: string, password: string): Promise<AuthUser>
  logout(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
}

class SupabaseAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.app_metadata?.role ?? '',
      tenantId: data.user.app_metadata?.tenant_id ?? '',
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return {
      id: user.id,
      email: user.email!,
      role: user.app_metadata?.role ?? '',
      tenantId: user.app_metadata?.tenant_id ?? '',
    }
  }
}

import { supabase } from '../supabase'

export const authProvider: AuthProvider = new SupabaseAuthProvider()
