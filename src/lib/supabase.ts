import { createClient, type Session as SupabaseSession, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)
export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'gatepass-auth-session',
      },
    })
  : null

export type AuthProfile = {
  id: string
  display_name: string
  email: string
  role: 'admin' | 'guest' | 'vip'
}

export type AuthResult = { ok: boolean; message: string; session?: SupabaseSession; user?: User }

function readableAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Authentication failed.'
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email address before signing in.'
  if (/already registered|user already registered/i.test(message)) return 'An account with this email already exists.'
  if (/password should be at least/i.test(message)) return 'Use a password with at least 8 characters.'
  return message
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) return { ok: false, message: readableAuthError(error) }
  return { ok: true, message: 'Signed in.', session: data.session ?? undefined, user: data.user ?? undefined }
}

export async function signUp(displayName: string, email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { display_name: displayName.trim() } },
  })
  if (error) return { ok: false, message: readableAuthError(error) }
  return {
    ok: true,
    message: data.session ? 'Account created.' : 'Account created. Check your email to confirm it before signing in.',
    session: data.session ?? undefined,
    user: data.user ?? undefined,
  }
}

export async function signOut(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'Authentication is not configured.' }
  const { error } = await supabase.auth.signOut()
  return error ? { ok: false, message: error.message } : { ok: true, message: 'Signed out.' }
}

export async function currentSession(): Promise<SupabaseSession | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function loadProfile(userId: string): Promise<{ profile: AuthProfile | null; error?: string }> {
  if (!supabase) return { profile: null, error: 'Authentication is not configured.' }
  const { data, error } = await supabase.from('profiles').select('id,display_name,email,role').eq('id', userId).maybeSingle()
  if (error) return { profile: null, error: error.message }
  if (!data) return { profile: null, error: 'Your account profile is not ready yet. Ask an administrator to finish setup.' }
  return { profile: data as AuthProfile }
}

export function authErrorMessage(error: unknown): string {
  return readableAuthError(error)
}
