import http from "node:http";

const port = Number(process.env.API_PORT || 4174);
const ratesToUsd = { USD: 1, EUR: 1.087, GBP: 1.282, UAH: 1 / 38.2 };

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};

const readJson = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });

const server = http.createServer(async (request, response) => {
  if (request.url === "/api/health") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
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
      response.writeHead(405, { Allow: "POST" });
      response.end();
      return;
    }

    try {
      const { amount, from, to } = await readJson(request);
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        !Object.hasOwn(ratesToUsd, from) ||
        !Object.hasOwn(ratesToUsd, to)
      ) {
        sendJson(response, 400, {
          error: "amount, from, and to must be valid supported currencies",
        });
        return;
      }

      const rate = ratesToUsd[from] / ratesToUsd[to];
      sendJson(response, 200, {
        amount: numericAmount,
        from,
        to,
        rate,
        convertedAmount: Math.round(numericAmount * rate * 100) / 100,
      });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local API listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
