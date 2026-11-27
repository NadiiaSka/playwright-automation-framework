import { spawn } from "node:child_process";
import { loadEnv } from "vite";

const mode = process.argv[2] || "development";
const env = loadEnv(mode, process.cwd(), "");
const requiredVariables = ["VITE_APP_HOST", "VITE_APP_PORT", "VITE_API_PORT"];
const missingVariables = requiredVariables.filter((name) => !env[name]);

if (missingVariables.length > 0) {
  const example =
    mode === "development" ? ".env.local.example" : `.env.${mode}.example`;
  throw new Error(
    `Missing startup configuration: ${missingVariables.join(", ")}. ` +
      `Set these variables or copy ${example} to the corresponding environment file.`,
  );
}

const children = [];

const childEnv = {
  ...process.env,
  API_PORT: env.VITE_API_PORT,
};

const startWithEnv = (command, args) => {
  const child = spawn(command, args, { env: childEnv, stdio: "inherit" });
  children.push(child);
  return child;
};

startWithEnv(process.execPath, ["server/local-api.js"]);
startWithEnv(process.execPath, [
  "node_modules/vite/bin/vite.js",
  "--mode",
  mode,
  "--host",
  env.VITE_APP_HOST,
  "--port",
  env.VITE_APP_PORT,
]);

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);
