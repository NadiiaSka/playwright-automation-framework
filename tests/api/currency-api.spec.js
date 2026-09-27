import { test, expect } from "@playwright/test";

test.describe("Local currency API contract", () => {
  test("returns a healthy status", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      timestamp: expect.any(String),
    });
  });

  test("converts a supported currency pair", async ({ request }) => {
    const response = await request.post("/api/convert", {
      data: { amount: 100, from: "USD", to: "UAH" },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      amount: 100,
      from: "USD",
      to: "UAH",
      convertedAmount: 3820,
    });
  });

  test("rejects unsupported currencies", async ({ request }) => {
    const response = await request.post("/api/convert", {
      data: { amount: 100, from: "USD", to: "XXX" },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid conversion request",
    });
  });

  test("rejects malformed JSON", async ({ request }) => {
    const response = await request.post("/api/convert", {
      headers: { "Content-Type": "application/json" },
      data: Buffer.from("{invalid-json"),
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Request body must be valid JSON",
    });
  });
});
