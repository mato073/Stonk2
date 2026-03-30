import { useEffect, useState } from 'react'
import { supabase } from './useSupabase'
import * as authApi from '../api/auth.api'
import type { AuthCredentials, AuthState } from '../types/auth.types'

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    authApi.getSession()
      .then((session) => {
        setState({ session, user: session?.user ?? null, loading: false })
      })
      .catch(() => {
        setState({ session: null, user: null, loading: false })
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false })
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(credentials: AuthCredentials) {
    return authApi.signIn(credentials)
  }

  async function signup(credentials: AuthCredentials) {
    return authApi.signUp(credentials)
  }

  async function logout() {
    return authApi.signOut()
  }

  return { ...state, login, signup, logout }
}
