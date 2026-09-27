import { test, expect } from "@playwright/test";

const securityHeaders = [
  "content-security-policy",
  "cache-control",
  "permissions-policy",
  "referrer-policy",
  "x-content-type-options",
  "x-frame-options",
];

test.describe("@security local application/API controls", () => {
  test("serves HTML with restrictive security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(response.status()).toBe(200);
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("script-src 'self'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["content-security-policy"]).not.toContain("'unsafe-eval'");
    expect(headers["content-security-policy"]).not.toContain("*");
    expect(headers["content-security-policy"]).toContain("https://flagcdn.com");
    expect(headers["content-security-policy"]).toContain(
      "https://api.fxratesapi.com",
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["server"]).toBeUndefined();
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("returns no-store security headers on API responses", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();

    expect(response.status()).toBe(200);
    for (const header of securityHeaders) {
      expect(headers[header], `${header} should be present`).toBeTruthy();
    }
    expect(headers["cache-control"]).toBe("no-store");
    expect(headers["content-security-policy"]).toContain("default-src 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["server"]).toBeUndefined();
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("does not allow arbitrary cross-origin access or preflight", async ({
    request,
  }) => {
    const response = await request.get("/api/health", {
      headers: { Origin: "https://attacker.invalid" },
    });
    const preflight = await request.fetch("/api/convert", {
      method: "OPTIONS",
      headers: {
        Origin: "https://attacker.invalid",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
    expect(preflight.status()).toBe(405);
    expect(preflight.headers().allow).toBe("POST");
    expect(preflight.headers()["access-control-allow-origin"]).toBeUndefined();
  });

  test("rejects unsupported methods with a safe 4xx response", async ({
    request,
  }) => {
    const response = await request.get("/api/convert");

    expect(response.status()).toBe(405);
    expect(response.headers().allow).toBe("POST");
    expect(await response.json()).toEqual({ error: "Method not allowed" });
  });

  test("rejects malformed JSON without exposing implementation details", async ({
    request,
  }) => {
    const response = await request.post("/api/convert", {
      headers: { "Content-Type": "application/json" },
      data: Buffer.from("{invalid-json"),
    });
    const body = await response.text();

    expect(response.status()).toBe(400);
    expect(body).toBe(
      JSON.stringify({ error: "Request body must be valid JSON" }),
    );
    expect(body).not.toMatch(/stack|node_modules|\\\\|token|secret|sql/i);
  });

  test("rejects non-JSON content types", async ({ request }) => {
    const response = await request.post("/api/convert", {
      headers: { "Content-Type": "text/plain" },
      data: '{"amount":100,"from":"USD","to":"UAH"}',
    });

    expect(response.status()).toBe(415);
    expect(await response.json()).toEqual({
      error: "Content-Type must be application/json",
    });
  });

  test("rejects missing, mistyped, extra, negative, and excessive fields", async ({
    request,
  }) => {
    const invalidPayloads = [
      { amount: 1, from: "USD" },
      { amount: "100", from: "USD", to: "UAH" },
      { amount: -1, from: "USD", to: "UAH" },
      { amount: 1_000_000_000_001, from: "USD", to: "UAH" },
      { amount: 100, from: "USD", to: "UAH", debug: true },
    ];

    for (const data of invalidPayloads) {
      const response = await request.post("/api/convert", { data });
      const body = await response.text();

      expect(response.status(), JSON.stringify(data)).toBe(400);
      expect(body).not.toMatch(/stack|node_modules|token|secret|sql/i);
    }
  });

  test("rejects XSS and injection strings without reflecting them", async ({
    request,
  }) => {
    const payloads = [
      "<script>alert(1)</script>",
      "' OR 1=1 --",
      "$(whoami)",
      "{{7*7}}",
    ];

    for (const from of payloads) {
      const response = await request.post("/api/convert", {
        data: { amount: 100, from, to: "UAH" },
      });
      const body = await response.text();

      expect(response.status()).toBe(400);
      expect(body).not.toContain(from);
      expect(body).not.toMatch(/stack|node_modules|token|secret|sql/i);
    }
  });

  test("rejects oversized request bodies", async ({ request }) => {
    const response = await request.post("/api/convert", {
      headers: { "Content-Type": "application/json" },
      data: Buffer.from(
        `{"amount":100,"from":"USD","to":"UAH","extra":"${"a".repeat(17 * 1024)}"}`,
      ),
    });
    const body = await response.text();

    expect(response.status()).toBe(413);
    expect(body).toBe(JSON.stringify({ error: "Request body is too large" }));
    expect(body).not.toMatch(/stack|node_modules|token|secret|sql/i);
  });
});
