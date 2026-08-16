import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

const hash = window.location.hash;
const isAuthHash = hash === "#/auth" || hash.startsWith("#/auth?") || hash === "";

async function start() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Pocket Ledger mobile root element was not found.");

  if (isAuthHash) {
    // Keep TanStack Router, but use a tiny router containing only the auth route.
    // The full application router/providers/charts are not loaded until after login.
    const { getMobileAuthRouter } = await import("./mobile-auth-router");
    const router = getMobileAuthRouter();
    createRoot(rootElement).render(<RouterProvider router={router} />);
    return;
  }

  // Authenticated app: load the normal application only after the auth screen.
  await import("./styles.css");
  const { getRouter } = await import("./router");
  const router = getRouter();
  createRoot(rootElement).render(<RouterProvider router={router} />);

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) window.history.back();
      else void App.exitApp();
    });
  } catch {
    // Web preview or plugin unavailable.
  }
}

void start();
