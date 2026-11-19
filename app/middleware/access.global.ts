import { APP_PATHS, getReturnPath, legacyLoginRoutes } from '../core/paths'
import { navigation } from '../core/navigation'
import { catalogByPath } from '../core/catalog'
import { useAuroraAuth } from '../composables/useAuroraAuth'

export default defineNuxtRouteMiddleware(to => {
  if (!import.meta.client) return
  const normalized = to.path.toLowerCase().replace(/\/+$/, '') || '/'
  const { user } = useAuroraAuth()
  const withDetails = (path: string) => ({ path, query: to.query, hash: to.hash })
  if (normalized === '/' || normalized === '/app') return navigateTo(withDetails(APP_PATHS.dashboard), { replace: true })
  const legacyLogin = legacyLoginRoutes.find(item => item.path === normalized)
  if (legacyLogin) return navigateTo(withDetails(legacyLogin.destination), { replace: true })
  if (/^\/(dashboard|crm|erp|financeiro|servicos|relatorios|componentes|exemplo-isolado)(\/|$)/i.test(normalized)) {
    return navigateTo(withDetails('/app' + normalized), { replace: true })
  }
  if (normalized === APP_PATHS.loginV1 || normalized === APP_PATHS.loginV2 || normalized === APP_PATHS.register) {
    if (user.value) return navigateTo(getReturnPath(useRouter().options.history.state), { replace: true })
    return
  }
  const protectedRoute = normalized.startsWith(APP_PATHS.isolatedExample + '/') ||
    catalogByPath.has(normalized) || navigation.some(group => group.pages.some(page => page.path === normalized))
  if (protectedRoute && !user.value) {
    return navigateTo({ path: APP_PATHS.loginV1, state: { returnTo: to.fullPath } }, { replace: true })
  }
  if (!normalized.startsWith('/app/')) return navigateTo(APP_PATHS.notFound, { replace: true })
})