import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:5174/NutriAll/",
    trace: "retain-on-failure",
  },
  reporter: "line",
});
