import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The Sui SDKs are large on their own; keep them in a cacheable vendor chunk.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@mysten/deepbook-v3")) return "deepbook";
          if (id.includes("@mysten/") || id.includes("@noble/") || id.includes("@scure/")) return "sui";
          if (/node_modules\/(react|react-dom|scheduler|@tanstack)\//.test(id)) return "react";
        },
      },
    },
  },
});
