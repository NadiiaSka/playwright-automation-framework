import http from "node:http";

const port = Number(process.env.API_PORT || 4174);
const ratesToUsd = { USD: 1, EUR: 1.087, GBP: 1.282, UAH: 1 / 38.2 };
const maxRequestBytes = 16 * 1024;
const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "Cache-Control": "no-store",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    ...securityHeaders,
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
};

const readJson = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let oversized = false;

    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxRequestBytes) {
        oversized = true;
      } else if (!oversized) {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (oversized) {
        reject(
          Object.assign(new Error("Request body is too large"), {
            statusCode: 413,
          }),
        );
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });

const server = http.createServer(async (request, response) => {
  if (request.url === "/api/health") {
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    sendJson(response, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.url === "/api/convert") {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    if (
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers["content-type"] || "",
      )
    ) {
      sendJson(response, 415, {
        error: "Content-Type must be application/json",
      });
      return;
    }

    try {
      const payload = await readJson(request);
      const allowedFields = new Set(["amount", "from", "to"]);
      const validObject =
        payload !== null &&
        typeof payload === "object" &&
        !Array.isArray(payload);
      const hasOnlySupportedFields =
        validObject &&
        Object.keys(payload).every((field) => allowedFields.has(field));
      const { amount, from, to } = validObject ? payload : {};

      if (
        !hasOnlySupportedFields ||
        Object.keys(payload).length !== allowedFields.size ||
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        amount > 1_000_000_000_000 ||
        typeof from !== "string" ||
        typeof to !== "string" ||
        !Object.hasOwn(ratesToUsd, from) ||
        !Object.hasOwn(ratesToUsd, to)
      ) {
        sendJson(response, 400, { error: "Invalid conversion request" });
        return;
      }

      const rate = ratesToUsd[from] / ratesToUsd[to];
      sendJson(response, 200, {
        amount,
        from,
        to,
        rate,
        convertedAmount: Math.round(amount * rate * 100) / 100,
      });
    } catch (error) {
      sendJson(response, error.statusCode || 400, {
        error:
          error.statusCode === 413
            ? "Request body is too large"
            : "Request body must be valid JSON",
      });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local API listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
