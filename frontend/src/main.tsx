import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx"

import { ErrorBoundary } from "@/common/layout/ErrorBoundary.tsx";
import { ThemeProvider } from "@/common/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"

import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "@/lib/queryClient.ts"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
              <Toaster />
            </BrowserRouter>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
