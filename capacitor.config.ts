import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shailshah.pocketledger",
  appName: "Pocket Ledger",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    Keyboard: {
      resize: "none",
      resizeOnFullScreen: false,
    },
  },
};

export default config;
