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
      // Let Android resize the WebView normally when the IME opens.
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
