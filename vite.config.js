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
        if ((host === "recipes.localhost" || pathname.startsWith("/recipe-admin")) && !pathname.includes(".") && !pathname.startsWith("/api/") && !pathname.startsWith("/@")) request.url = "/recipes-admin.html";
        if ((host === "newsletter.localhost" || pathname.startsWith("/newsletter-admin")) && !pathname.includes(".") && !pathname.startsWith("/api/") && !pathname.startsWith("/@")) request.url = "/newsletter-admin.html";
        next();
      });
    },
  };
}

export default defineConfig({
  base: globalThis.process?.env.VITE_BASE || "/",
  publicDir: "assets",
  plugins: [react(), surveyLocalhost()],
  server: { proxy: { "/api/recipes": "http://127.0.0.1:8790", "/api/recipe-manage": "http://127.0.0.1:8790", "/api/newsletter-manage": "http://127.0.0.1:8790" } },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        survey: path.resolve(import.meta.dirname, "survey.html"),
        recipesAdmin: path.resolve(import.meta.dirname, "recipes-admin.html"),
        newsletterAdmin: path.resolve(import.meta.dirname, "newsletter-admin.html"),
      },
    },
  },
});
