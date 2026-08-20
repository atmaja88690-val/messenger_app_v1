import { createRouter, createRoute, createRootRoute, Outlet, redirect, createHashHistory } from '@tanstack/react-router'
import LoginPage from '../components/auth/LoginPage'
import App from '../App'
import AdminPage from '../components/admin/AdminPage'
import DbAdminPage from '../components/admin/DbAdminPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (!localStorage.getItem('bsi_access_token')) {
      throw redirect({ to: '/login' })
    }
  },
  component: App
})

// Guard token sama seperti chatRoute. Cek ADMIN dilakukan di dalam AdminPage
// (accountType baru tersedia setelah store ter-hydrate). Backend tetap penjaga
// sesungguhnya: semua route /admin di-guard requireAdmin().
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => {
    if (!localStorage.getItem('bsi_access_token')) {
      throw redirect({ to: '/login' })
    }
  },
  component: AdminPage
})

// Guard token sama seperti adminRoute. Cek MODERATOR (KETAT, bukan
// admin+moderator) dilakukan di dalam DbAdminPage sendiri. Backend tetap
// penjaga sesungguhnya: semua route /dbadmin di-guard requireModerator().
const dbAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dbadmin',
  beforeLoad: () => {
    if (!localStorage.getItem('bsi_access_token')) {
      throw redirect({ to: '/login' })
    }
  },
  component: DbAdminPage
})

const routeTree = rootRoute.addChildren([loginRoute, chatRoute, adminRoute, dbAdminRoute])

export const router = createRouter({ routeTree, history: createHashHistory() })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
