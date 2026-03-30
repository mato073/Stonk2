import type { Session, User } from '@supabase/supabase-js'

export type AuthCredentials = {
  email: string
  password: string
}

export type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
}
