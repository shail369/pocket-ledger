import "./styles.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppStateProvider } from "@/lib/app-state";
import { AuthScreen } from "@/components/app/auth-screen";
import { RouterProvider } from "./router";
import { Route as ShellRoute } from "./routes/_shell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-dvh place-items-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!session) return <AuthScreen />;

  const Shell = ShellRoute.component;
  return <Shell />;
}

async function start() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Pocket Ledger app root element was not found.");

  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppStateProvider>
            <RouterProvider>
              <App />
            </RouterProvider>
          </AppStateProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { App: CapacitorApp } = await import("@capacitor/app");
    await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) window.history.back();
      else void CapacitorApp.exitApp();
    });
  } catch {
    // Web preview or plugin unavailable.
  }
}

void start();
