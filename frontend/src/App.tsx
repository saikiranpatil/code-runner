import { Outlet, Route, Routes } from "react-router-dom"

import Navbar from "@/layout/Navbar"
import { URLs } from "@/shared/urls"
import AuthPage from "@/pages/Auth"
import Problem from "@/pages/Problem"

export default function App() {
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <Routes>
        <Route path={URLs.auth.base} element={<AuthPage />} />
        <Route
          element={
            <>
              <Navbar />
              <Outlet />
            </>
          }
        >
          <Route path={URLs.home.base} element={<>Home</>} />
          <Route path={URLs.problems.base}>
            <Route index element={<Problem />} />
            <Route path={URLs.problems.problem} element={<>ProblemDetails</>} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}