import { createBrowserAuth, type User } from '../core/auth'

let browserAuth: ReturnType<typeof createBrowserAuth> | undefined

export function useAuroraAuth() {
  const user = useState<User | null>('aurora-auth-user', () => null)
  if (!browserAuth && import.meta.client) {
    browserAuth = createBrowserAuth(nextUser => { user.value = nextUser }, useRuntimeConfig().app.baseURL)
    user.value = browserAuth.user
  }
  return { user, auth: browserAuth }
}
