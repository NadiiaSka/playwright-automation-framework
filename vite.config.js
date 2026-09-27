import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server:
      mode === "production"
        ? undefined
        : {
            proxy: {
              "/api": env.VITE_LOCAL_API_URL,
            },
          },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./tests/setup.js",
      exclude: ["**/e2e/**", "**/node_modules/**", "**/dist/**"],
    },
  };
});
