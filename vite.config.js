import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Vite injects an inline HMR bootstrap only in development mode.
  const developmentHeaders = {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://flagcdn.com; connect-src 'self' ws: wss: https://api.fxratesapi.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };

  return {
    plugins: [react()],
    ...(mode === "production"
      ? {}
      : {
          server: {
            headers: developmentHeaders,
            cors: false,
            proxy: {
              "/api": env.VITE_LOCAL_API_URL,
            },
          },
        }),
    test: {
      environment: "jsdom",
      globals: true,
      include: ["tests/**/*.test.{js,jsx}"],
      setupFiles: "./tests/setup.js",
      exclude: [
        "**/api/**",
        "**/e2e/**",
        "**/security/**",
        "**/visual/**",
        "**/performance/**",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  };
});
