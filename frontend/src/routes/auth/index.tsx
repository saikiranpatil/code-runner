import { createFileRoute } from '@tanstack/react-router'
import SidePanel from '@/routes/auth/-components/SidePanel'
import AuthForm from '@/routes/auth/-components/AuthForm'

export const Route = createFileRoute('/auth/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      <SidePanel />
      <AuthForm />
    </div>
  )
}
