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

describe("currency flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
    window.localStorage.clear();
  });

  it("converts a valid amount when both currencies are selected", async () => {
    const user = userEvent.setup();
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
      expect(screen.getByText(/100 USD/i)).toBeInTheDocument();
      expect(screen.getByText(/3,820 UAH/i)).toBeInTheDocument();
    });
  });

  it("accepts zero as a valid amount and shows a zero conversion result", async () => {
    const user = userEvent.setup();
    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "0");

    await selectCountry({
      label: /from/i,
      optionName: "^UAH - Ukraine$",
      user,
    });

    await selectCountry({
      label: /to/i,
      optionName: "^USD - United States$",
      user,
    });

    await waitFor(() => {
      expect(screen.getByText(/0 USD/i)).toBeInTheDocument();
      expect(screen.getByText(/0 UAH/i)).toBeInTheDocument();
    });
  });

  it("returns zero when converting zero from a smaller currency to a larger one", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("https://api.fxratesapi.com/latest", () =>
        HttpResponse.json(
          {
            rates: {
              USD: 0.02,
            },
          },
          { status: 200 },
        ),
      ),
    );

    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "0");

    await selectCountry({
      label: /from/i,
      optionName: "^UAH - Ukraine$",
      user,
    });

    await selectCountry({
      label: /to/i,
      optionName: "^USD - United States$",
      user,
    });

    await waitFor(() => {
      expect(screen.getByText(/0 UAH/i)).toBeInTheDocument();
      expect(screen.getByText(/0 USD/i)).toBeInTheDocument();
    });
  });

  it("does not trigger a conversion if the amount is empty", async () => {
    const user = userEvent.setup();
    renderApp();

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

    expect(screen.queryByText(/=/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s+UAH/i)).not.toBeInTheDocument();
  });

  it("does not show a conversion when one currency is missing", async () => {
    const user = userEvent.setup();
    renderApp();

    const amountInput = screen.getByRole("textbox", { name: /amount/i });
    await user.type(amountInput, "100");

    await selectCountry({
      label: /from/i,
      optionName: "^USD - United States$",
      user,
    });

    expect(screen.getByText(/100 USD/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s+UAH/i)).not.toBeInTheDocument();
  });

  it("updates the conversion when the user switches the currency direction", async () => {
    const user = userEvent.setup();
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

    const switchButton = screen.getByRole("button", {
      name: /switch currencies/i,
    });
    await user.click(switchButton);

    await waitFor(() => {
      expect(screen.getByText(/100 UAH/i)).toBeInTheDocument();
    });
  });
});
