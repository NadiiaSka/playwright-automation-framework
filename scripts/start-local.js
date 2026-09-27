import { spawn } from "node:child_process";
import { loadEnv } from "vite";

const mode = process.argv[2] || "local";
const env = loadEnv(mode, process.cwd(), "");
const children = [];

const start = (command, args) => {
  const child = spawn(command, args, { stdio: "inherit" });
  children.push(child);
  return child;
};

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
