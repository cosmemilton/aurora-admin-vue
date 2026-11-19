const appRoot = '/app'

export const APP_PATHS = {
  root: appRoot,
  loginV1: `${appRoot}/login-v1`,
  loginV2: `${appRoot}/login-v2`,
  register: `${appRoot}/inscricao`,
  recoverEmail: `${appRoot}/recuperar-email`,
  recoverPassword: `${appRoot}/recuperar-senha`,
  setPassword: `${appRoot}/cadastro-de-senha`,
  notFound: `${appRoot}/nao-encontrado`,
  dashboard: `${appRoot}/dashboard`,
  catalog: `${appRoot}/componentes`,
  isolatedExample: `${appRoot}/exemplo-isolado`,
} as const

export const legacyLoginRoutes = [
  { path: `${appRoot}/login`, destination: APP_PATHS.loginV1 },
  { path: `${appRoot}/login/ilustrado`, destination: APP_PATHS.loginV2 },
] as const

const publicPaths = new Set<string>([
  APP_PATHS.loginV1, APP_PATHS.loginV2, APP_PATHS.register, APP_PATHS.recoverEmail,
  APP_PATHS.recoverPassword, APP_PATHS.setPassword, APP_PATHS.notFound,
  ...legacyLoginRoutes.map(({ path }) => path),
])

export function getLoginPath(state: unknown) {
  return state && typeof state === 'object' && 'loginVersion' in state && state.loginVersion === 'LoginV2'
    ? APP_PATHS.loginV2
    : APP_PATHS.loginV1
}

export function getReturnPath(state: unknown) {
  if (!state || typeof state !== 'object' || !('returnTo' in state)) return APP_PATHS.dashboard

  const { returnTo } = state
  if (typeof returnTo !== 'string' || !returnTo.toLowerCase().startsWith(`${APP_PATHS.root}/`)) return APP_PATHS.dashboard

  const origin = 'https://aurora.invalid'
  const url = new URL(returnTo, origin)
  let pathname: string
  try {
    pathname = decodeURI(url.pathname).toLowerCase().replace(/\/+$/, '')
  } catch {
    return APP_PATHS.dashboard
  }
  if (url.origin !== origin || !pathname.startsWith(`${APP_PATHS.root}/`) || publicPaths.has(pathname)) return APP_PATHS.dashboard

  return `${url.pathname}${url.search}${url.hash}`
}
