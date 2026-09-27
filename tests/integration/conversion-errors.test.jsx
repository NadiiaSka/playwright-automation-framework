import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import App from "../../src/App";
import CurrencyProvider from "../../src/context/CurrencyContext";
import { server } from "../server";

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </QueryClientProvider>,
  );
};

const selectCountry = async ({ label, optionName, user }) => {
  const input = await screen.findByRole("combobox", { name: label });
  await user.click(input);

  const option = await screen.findByRole("option", {
    name: new RegExp(optionName, "i"),
  });

  await user.click(option);
};

describe("conversion errors", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
    window.localStorage.clear();
  });

  it("shows a safe fallback error message when the API fails", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("https://api.fxratesapi.com/latest", () =>
        HttpResponse.json({ error: "Conversion failed" }, { status: 500 }),
      ),
    );

    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "100");

    await selectCountry({
      label: /from/i,
      optionName: "^USD - United States$",
      user,
    });

    await selectCountry({
      label: /to/i,
      optionName: "^UAH - Ukraine$",
      user,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong while fetching the conversion/i),
      ).toBeInTheDocument();
    });
  });

  it("shows a safe fallback when the API returns a malformed response", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("https://api.fxratesapi.com/latest", () =>
        HttpResponse.json({ message: "ok" }, { status: 200 }),
      ),
    );

    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "100");

    await selectCountry({
      label: /from/i,
      optionName: "^USD - United States$",
      user,
    });

    await selectCountry({
      label: /to/i,
      optionName: "^UAH - Ukraine$",
      user,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong while fetching the conversion/i),
      ).toBeInTheDocument();
    });
  });

  it("shows a safe fallback when the API request is rejected", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("https://api.fxratesapi.com/latest", () => HttpResponse.error()),
    );

    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "100");

    await selectCountry({
      label: /from/i,
      optionName: "^USD - United States$",
      user,
    });

    await selectCountry({
      label: /to/i,
      optionName: "^UAH - Ukraine$",
      user,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong while fetching the conversion/i),
      ).toBeInTheDocument();
    });
  });
});
