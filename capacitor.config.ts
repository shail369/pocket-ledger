import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shailshah.pocketledger",
  appName: "Pocket Ledger",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // https scheme keeps secure-context APIs (crypto, storage) working for auth.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    Keyboard: {
      // Resize the web view body when the IME opens; "native" can leave the
      // WebView unresponsive on some Android devices.
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
