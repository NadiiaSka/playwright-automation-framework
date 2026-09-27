import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SwitchCurrency from "../../src/components/SwitchCurrency";
import { defaultCurrencyState } from "../fixtures/defaultCurrencyState";
import { renderWithProviders } from "../fixtures/renderWithProviders";

const renderSwitchCurrency = ({
  fromCurrency = null,
  toCurrency = null,
} = {}) => {
  const setFromCurrency = vi.fn();
  const setToCurrency = vi.fn();

  renderWithProviders({
    ui: <SwitchCurrency />,
    initialValues: {
      ...defaultCurrencyState,
      fromCurrency,
      toCurrency,
    },
    setters: { setFromCurrency, setToCurrency },
  });

  return {
    button: screen.getByRole("button", { name: /switch currencies/i }),
    setFromCurrency,
    setToCurrency,
  };
};

describe("Switch Currency", () => {
  describe("Positive", () => {
    it("Swap button exchanges source and target values when both are selected", async () => {
      const user = userEvent.setup();
      const fromCurrency = { name: { common: "United States" } };
      const toCurrency = { name: { common: "Ukraine" } };
      const { button, setFromCurrency, setToCurrency } = renderSwitchCurrency({
        fromCurrency,
        toCurrency,
      });

      await user.click(button);

      expect(setFromCurrency).toHaveBeenCalledWith(toCurrency);
      expect(setToCurrency).toHaveBeenCalledWith(fromCurrency);
    });
  });

  describe("Negative", () => {
    it("Swap button does not crash when selections are empty", async () => {
      const user = userEvent.setup();
      const { button, setFromCurrency, setToCurrency } = renderSwitchCurrency();

      await user.click(button);

      expect(setFromCurrency).toHaveBeenCalledWith(null);
      expect(setToCurrency).toHaveBeenCalledWith(null);
    });
  });

  describe("Edge", () => {
    it("Swap button still attempts the swap when only one side is selected", async () => {
      const user = userEvent.setup();
      const fromCurrency = { name: { common: "United States" } };
      const { button, setFromCurrency, setToCurrency } = renderSwitchCurrency({
        fromCurrency,
        toCurrency: null,
      });

      await user.click(button);

      expect(setFromCurrency).toHaveBeenCalledWith(null);
      expect(setToCurrency).toHaveBeenCalledWith(fromCurrency);
    });
  });
});
