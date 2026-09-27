import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

const env = loadEnv("ci", process.cwd(), "");
const appUrl = process.env.BASE_URL || env.VITE_APP_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: appUrl,
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev:ci",
    url: `${appUrl}/api/health`,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
