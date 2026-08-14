import "./styles.css";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Pocket Ledger mobile root element was not found.");
}

createRoot(rootElement).render(<RouterProvider router={router} />);

// Native Android hardware back button: navigate back, or exit at the root screen.
void (async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) window.history.back();
      else void App.exitApp();
    });
  } catch {
    // Web preview or plugin unavailable — nothing to wire up.
  }
})();
