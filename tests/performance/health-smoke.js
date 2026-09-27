import http from "k6/http";
import { check } from "k6";

const baseUrl = __ENV.BASE_URL;

if (!baseUrl) {
  throw new Error("BASE_URL must be provided for the k6 smoke test");
}

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ["rate==0"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/health`);

  check(response, {
    "returns HTTP 200": (result) => result.status === 200,
    "returns healthy status": (result) =>
      result.status === 200 &&
      result.body !== null &&
      result.json("status") === "ok",
  });
}
