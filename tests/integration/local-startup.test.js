import { spawnSync } from "node:child_process";
import { mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("reports missing startup configuration before starting the API", () => {
  const directory = mkdtempSync(join(tmpdir(), "local-startup-"));

  try {
    const result = spawnSync(process.execPath, [resolve("scripts/start-local.js")], {
      cwd: directory,
      encoding: "utf8",
      env: { SystemRoot: process.env.SystemRoot || "" },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Missing startup configuration: VITE_APP_HOST, VITE_APP_PORT, VITE_API_PORT",
    );
    expect(result.stderr).toContain(".env.local.example");
    expect(result.stdout).not.toContain("Local API listening");
  } finally {
    rmdirSync(directory);
  }
});
