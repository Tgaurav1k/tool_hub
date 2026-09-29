import { API_URL } from '@toolhub/config'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(data.error || 'Request failed', res.status, data.details)
  }

  return data as T
}

export class ApiError extends Error {
  status: number
  details?: { field: string; message: string }[]

  constructor(message: string, status: number, details?: { field: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}
