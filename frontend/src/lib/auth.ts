import { LoginResponse } from '@/types'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getUser(): LoginResponse | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function saveAuth(data: LoginResponse) {
  localStorage.setItem('token', data.token)
  localStorage.setItem('user', JSON.stringify(data))
}

export function updateUser(partial: Partial<LoginResponse>) {
  const current = getUser()
  if (!current) return
  localStorage.setItem('user', JSON.stringify({ ...current, ...partial }))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
