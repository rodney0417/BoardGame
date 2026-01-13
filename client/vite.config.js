import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/socket.io": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
    allowedHosts: true,
  },
});
