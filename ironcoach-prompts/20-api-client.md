# Prompt 20 — Typed API Client (Web + Mobile)

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 04 complete (auth working), Step 14 complete (shared types exist).
> **أضفه مباشرة بعد الخطوة 14 — قبل بناء أي صفحة web أو mobile screen.**

---

## Task

بناء typed API client مشترك يُستخدم في `apps/web` و`apps/mobile` — مع auto token refresh، error handling موحّد، و type safety كاملة.

---

## Part A: `packages/shared/src/api-client/` (Base Client)

هذا الـ core logic المشترك — لا يعتمد على أي browser أو React Native API.

### `packages/shared/src/api-client/types.ts`

```typescript
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  skipAuth?: boolean        // for public endpoints like /auth/login
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: Record<string, string[]>
}

export class ApiException extends Error {
  constructor(
    public readonly error: ApiError,
    public readonly statusCode: number
  ) {
    super(error.message)
    this.name = 'ApiException'
  }
}

// Token store interface — implemented differently on web vs mobile
export interface TokenStore {
  getAccessToken(): Promise<string | null>
  getRefreshToken(): Promise<string | null>
  setTokens(accessToken: string, refreshToken: string): Promise<void>
  clearTokens(): Promise<void>
}
```

### `packages/shared/src/api-client/base-client.ts`

```typescript
export class BaseApiClient {
  private isRefreshing = false
  private refreshQueue: Array<(token: string) => void> = []

  constructor(
    private readonly baseUrl: string,
    private readonly tokenStore: TokenStore,
    private readonly onAuthFailure?: () => void   // e.g. redirect to login
  ) {}

  async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, params, headers = {}, skipAuth = false } = config

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v))
      })
    }

    // Auth header
    if (!skipAuth) {
      const token = await this.tokenStore.getAccessToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const fetchConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }

    const response = await fetch(url.toString(), fetchConfig)

    // ── Token expired → refresh and retry once ──────────
    if (response.status === 401 && !skipAuth) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        // Retry original request with new token
        fetchConfig.headers = {
          ...fetchConfig.headers,
          Authorization: `Bearer ${newToken}`,
        }
        const retryResponse = await fetch(url.toString(), fetchConfig)
        return this.parseResponse<T>(retryResponse)
      } else {
        // Refresh failed → force logout
        await this.tokenStore.clearTokens()
        this.onAuthFailure?.()
        throw new ApiException(
          { code: 'AUTH_REQUIRED', message: 'Session expired', statusCode: 401 },
          401
        )
      }
    }

    return this.parseResponse<T>(response)
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Deduplicate concurrent refresh calls
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve)
      })
    }

    this.isRefreshing = true
    try {
      const refreshToken = await this.tokenStore.getRefreshToken()
      if (!refreshToken) return null

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return null

      const data = await response.json()
      const { accessToken, refreshToken: newRefreshToken } = data.data
      await this.tokenStore.setTokens(accessToken, newRefreshToken)

      // Resolve all queued requests
      this.refreshQueue.forEach(resolve => resolve(accessToken))
      this.refreshQueue = []
      return accessToken
    } catch {
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const error: ApiError = isJson && data.error
        ? { ...data.error, statusCode: response.status }
        : { code: 'UNKNOWN_ERROR', message: 'An error occurred', statusCode: response.status }
      throw new ApiException(error, response.status)
    }

    // Unwrap { success: true, data: T } envelope
    return (isJson && 'data' in data ? data.data : data) as T
  }

  // Convenience methods
  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'GET' })
  }
  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'POST', body })
  }
  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'PUT', body })
  }
  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'PATCH', body })
  }
  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'DELETE' })
  }
}
```

---

## Part B: Web API Client — `apps/web/lib/api.ts`

```typescript
import { BaseApiClient, TokenStore } from '@ironcoach/shared'

// Web token store — uses httpOnly cookies via API route + in-memory for access token
class WebTokenStore implements TokenStore {
  private accessToken: string | null = null

  async getAccessToken() { return this.accessToken }
  async getRefreshToken() {
    // Refresh token is in httpOnly cookie — sent automatically
    // We never read it directly in JS — the /auth/refresh call uses it
    return 'from-cookie'  // signal to use cookie-based refresh
  }
  async setTokens(accessToken: string, _refreshToken: string) {
    this.accessToken = accessToken
    // refreshToken is set as httpOnly cookie by the API — handled server-side
  }
  async clearTokens() {
    this.accessToken = null
    // Clear cookie via API route
    await fetch('/api/auth/logout', { method: 'POST' })
  }
  setAccessToken(token: string) { this.accessToken = token }
}

export const tokenStore = new WebTokenStore()

export const api = new BaseApiClient(
  process.env.NEXT_PUBLIC_API_URL!,
  tokenStore,
  () => { window.location.href = '/login' }
)

// Strongly typed endpoint methods — add as needed
export const authApi = {
  login: (body: LoginInput) =>
    api.post<LoginResponse>('/auth/login', body, { skipAuth: true }),
  register: (body: RegisterInput) =>
    api.post<LoginResponse>('/auth/register', body, { skipAuth: true }),
  logout: () => api.post('/auth/logout'),
  acceptInvite: (body: AcceptInviteInput) =>
    api.post<LoginResponse>('/auth/accept-invite', body, { skipAuth: true }),
}

export const coachApi = {
  dashboard: () => api.get<CoachDashboard>('/trainers/dashboard'),
  trainees: (params?: ListTraineesParams) =>
    api.get<PaginatedResponse<TraineeSummary>>('/trainers/trainees', { params }),
  trainee: (id: string) => api.get<TraineeDetail>(`/trainers/trainees/${id}`),
  inviteTrainee: (body: InviteTraineeInput) =>
    api.post<{ traineeId: string; inviteUrl: string }>('/trainers/trainees/invite', body),
}

export const workoutApi = {
  programs: () => api.get<WorkoutProgram[]>('/workout-programs'),
  program: (id: string) => api.get<WorkoutProgramFull>(`/workout-programs/${id}`),
  createProgram: (body: CreateProgramInput) =>
    api.post<WorkoutProgram>('/workout-programs', body),
  assignProgram: (programId: string, body: AssignProgramInput) =>
    api.post(`/workout-programs/${programId}/assign`, body),
  today: () => api.get<TodayWorkout>('/workout-logs/today'),
  startSession: (body: StartSessionInput) =>
    api.post<WorkoutLog>('/workout-logs', body),
  logSets: (logId: string, body: LogSetsInput) =>
    api.put<WorkoutLog>(`/workout-logs/${logId}/sets`, body),
  completeSession: (logId: string, body: CompleteSessionInput) =>
    api.put<WorkoutLog>(`/workout-logs/${logId}/complete`, body),
}

export const nutritionApi = {
  plans: () => api.get<NutritionPlan[]>('/nutrition/plans'),
  today: () => api.get<TodayNutrition>('/nutrition/today'),
}

export const progressApi = {
  submitCheckin: (body: SubmitCheckinInput) =>
    api.post('/progress/checkins', body),
  myCheckins: () => api.get('/progress/checkins/me'),
  traineeProgress: (traineeId: string) =>
    api.get<TraineeProgress>(`/progress/trainee/${traineeId}`),
}

export const chatApi = {
  conversations: () => api.get<Conversation[]>('/chat/conversations'),
  messages: (convoId: string, cursor?: string) =>
    api.get<CursorPaginatedResponse<Message>>(`/chat/${convoId}/messages`, {
      params: { cursor }
    }),
}
```

---

## Part C: Mobile API Client — `apps/mobile/lib/api.ts`

```typescript
import * as SecureStore from 'expo-secure-store'
import { BaseApiClient, TokenStore } from '@ironcoach/shared'
import { router } from 'expo-router'

const KEYS = {
  ACCESS: 'ironcoach_access_token',
  REFRESH: 'ironcoach_refresh_token',
}

class MobileTokenStore implements TokenStore {
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS)
  }
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH)
  }
  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
    ])
  }
  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
    ])
  }
}

export const api = new BaseApiClient(
  process.env.EXPO_PUBLIC_API_URL!,
  new MobileTokenStore(),
  () => router.replace('/(auth)/login')
)

// Same typed methods as web — import from a shared file
// or re-export from packages/shared/src/api-client/endpoints.ts
export { authApi, workoutApi, nutritionApi, progressApi, chatApi } from './api-endpoints'
```

---

## Part D: TanStack Query Setup

### `apps/web/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'
import { ApiException } from '@ironcoach/shared'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiException && error.statusCode < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiException && error.statusCode === 401) {
          // Handled by api client — do nothing here
          return
        }
        // Toast notification — implemented in the app
        console.error('Mutation error:', error)
      },
    },
  },
})
```

### Query key factory — `apps/web/lib/query-keys.ts`

```typescript
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  coach: {
    dashboard: () => ['coach', 'dashboard'] as const,
    trainees: (filters?: object) => ['coach', 'trainees', filters] as const,
    trainee: (id: string) => ['coach', 'trainees', id] as const,
  },
  workouts: {
    programs: () => ['workouts', 'programs'] as const,
    program: (id: string) => ['workouts', 'programs', id] as const,
    today: () => ['workouts', 'today'] as const,
    exercises: (filters?: object) => ['workouts', 'exercises', filters] as const,
  },
  nutrition: {
    plans: () => ['nutrition', 'plans'] as const,
    today: () => ['nutrition', 'today'] as const,
  },
  progress: {
    checkins: () => ['progress', 'checkins'] as const,
    traineeProgress: (id: string) => ['progress', 'trainee', id] as const,
  },
  chat: {
    conversations: () => ['chat', 'conversations'] as const,
    messages: (convoId: string) => ['chat', 'messages', convoId] as const,
  },
}
```

### Mutation with optimistic update example (for workout logging):

```typescript
// In workout session component:
const logSetsMutation = useMutation({
  mutationFn: ({ logId, body }) => workoutApi.logSets(logId, body),
  onMutate: async ({ logId, body }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.workouts.today() })
    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.workouts.today())
    // Optimistically update
    queryClient.setQueryData(queryKeys.workouts.today(), (old) => ({
      ...old,
      // mark set as done locally immediately
    }))
    return { previous }
  },
  onError: (_, __, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.workouts.today(), context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.today() })
  },
})
```

---

## Output Requirements

- `BaseApiClient` handles token refresh with request deduplication (no double-refresh on concurrent 401s)
- `ApiException` is thrown for all non-2xx responses — never raw `Error`
- Web token store uses in-memory access token (never localStorage)
- Mobile token store uses `expo-secure-store` (encrypted on device)
- `queryKeys` factory used consistently — no magic strings in components
- `pnpm type-check` passes across all apps
