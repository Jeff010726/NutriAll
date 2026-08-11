import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: globalThis.process?.env.VITE_BASE || "/",
  publicDir: "assets",
  plugins: [react()],
});
