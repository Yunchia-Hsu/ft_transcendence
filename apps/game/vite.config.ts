import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // => '@/x' -> 'src/x'
      // optional: direct alias to shared api
      "@api": path.resolve(__dirname, "src/shared/api"), // => '@api' -> 'src/shared/api'
    },
  },
});
