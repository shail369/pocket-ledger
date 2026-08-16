import { mountMobileAuth } from "./mobile-auth-vanilla";

const hash = window.location.hash;
const isAuthHash = hash === "#/auth" || hash.startsWith("#/auth?") || hash === "";

async function start() {
  if (isAuthHash) {
    mountMobileAuth();

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.hash = "#/";
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Mobile auth session check failed", error);
    }
    return;
  }

  await import("./styles.css");
  const { createRoot } = await import("react-dom/client");
  const { RouterProvider } = await import("@tanstack/react-router");
  const { getRouter } = await import("./router");

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Pocket Ledger mobile root element was not found.");

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
