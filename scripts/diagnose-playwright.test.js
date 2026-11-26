import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnose } from "./diagnose-playwright.js";

test("uses a model-requested test file to diagnose a captured failure", async () => {
  const reads = [];
  const requests = [];
  const result = await diagnose({
    failedSuites: ["functional"],
    model: "test-model",
    readText: async (path) => {
      reads.push(path);
      return path.endsWith(".log") ? "Expected button, received none" : "test source";
    },
    chat: async (request) => {
      requests.push(structuredClone(request));
      if (requests.length === 1) {
        return { message: { role: "assistant", tool_calls: [{ function: {
          name: "read_test_file",
          arguments: { path: "tests/e2e/currency-conversion.spec.js" },
        } }] } };
      }
      return { message: { role: "assistant", content: "Investigate the missing button." } };
    },
  });
  assert.equal(result, "Investigate the missing button.");
  assert.deepEqual(reads, [
    "diagnostic-input/functional-reports/diagnostics/functional.log",
    "tests/e2e/currency-conversion.spec.js",
  ]);
  assert.match(requests[0].messages[1].content, /Expected button, received none/);
  assert.equal(requests[1].messages.at(-1).content, "test source");
});

test("denies source paths outside the failed suites", async () => {
  const reads = [];
  let turn = 0;
  const result = await diagnose({
    failedSuites: ["api"],
    model: "test-model",
    readText: async (path) => { reads.push(path); return "failed"; },
    chat: async ({ messages }) => {
      if (turn++ === 0) return { message: { role: "assistant", tool_calls: [{ function: {
        name: "read_test_file",
        arguments: { path: ".env" },
      } }] } };
      assert.match(messages.at(-1).content, /unsupported/);
      return { message: { role: "assistant", content: "Insufficient evidence." } };
    },
  });
  assert.equal(result, "Insufficient evidence.");
  assert.deepEqual(reads, ["diagnostic-input/api-reports/diagnostics/api.log"]);
});

test("reports missing test logs without claiming a passing test", async () => {
  const result = await diagnose({
    failedSuites: ["security"],
    model: "test-model",
    readText: async () => { const error = new Error("not found"); error.code = "ENOENT"; throw error; },
    chat: async ({ messages }) => {
      assert.match(messages[1].content, /Test log unavailable/);
      return { message: { role: "assistant", content: "Review the job setup." } };
    },
  });
  assert.equal(result, "Review the job setup.");
});

test("surfaces model errors and rejects unsupported suites", async () => {
  const options = {
    failedSuites: ["api"],
    model: "test-model",
    readText: async () => "failed",
    chat: async () => { throw new Error("model offline"); },
  };
  await assert.rejects(diagnose(options), /model offline/);
  await assert.rejects(diagnose({ ...options, failedSuites: ["unknown"] }), /supported failed suite/);
});
