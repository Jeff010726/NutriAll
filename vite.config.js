import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

function surveyLocalhost() {
  return {
    name: "survey-localhost",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const host = request.headers.host?.split(":")[0] || "";
        const pathname = request.url?.split("?")[0] || "/";
        if (host === "survey.localhost" && !pathname.includes(".") && !pathname.startsWith("/@")) {
          request.url = "/survey.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: globalThis.process?.env.VITE_BASE || "/",
  publicDir: "assets",
  plugins: [react(), surveyLocalhost()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        survey: path.resolve(import.meta.dirname, "survey.html"),
      },
    },
  },
});
