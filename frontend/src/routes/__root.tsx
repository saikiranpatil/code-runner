import Navbar from '@/components/layout/Navbar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const queryClient = new QueryClient()

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <Navbar />
            <Outlet />
            <TanStackRouterDevtools />
        </QueryClientProvider>
    ),
})