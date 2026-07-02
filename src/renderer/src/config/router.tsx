import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import LoginPage from '../components/auth/LoginPage'
import App from '../App'

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

const routeTree = rootRoute.addChildren([loginRoute, chatRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
