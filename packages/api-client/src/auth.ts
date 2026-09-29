import { apiRequest } from '@toolhub/auth'
import type { User } from './types'

export async function login(email: string, password: string) {
  return apiRequest<{ user: User }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function signup(name: string, email: string, password: string) {
  return apiRequest<{ user: User; message: string }>('/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  })
}

export async function logout() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
}

export async function getMe() {
  return apiRequest<{ user: User }>('/auth/me')
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string; linkedToolSyncWarnings?: string[] }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  })
}
