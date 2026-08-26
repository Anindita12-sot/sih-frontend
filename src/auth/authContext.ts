import { createContext } from 'react'

import type { AuthUser, LoginRequest } from '@/services/contracts'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
