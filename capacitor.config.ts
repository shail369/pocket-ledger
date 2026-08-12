import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shailshah.pocketledger",
  appName: "Pocket Ledger",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    Keyboard: {
      // Let Android resize the WebView normally when the IME opens.
      // Keeping resize disabled can leave the WebView under the keyboard
      // and can cause broken input repaint/focus behavior on some devices.
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
