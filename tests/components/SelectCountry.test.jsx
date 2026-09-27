import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectCountry from "../../src/components/SelectCountry";
import { defaultCurrencyState } from "../fixtures/defaultCurrencyState";
import { renderWithProviders } from "../fixtures/renderWithProviders";

const renderSelectCountry = ({
  value = null,
  setValue = vi.fn(),
  label = "from",
} = {}) => {
  renderWithProviders({
    ui: <SelectCountry value={value} setValue={setValue} label={label} />,
    initialValues: {
      ...defaultCurrencyState,
      fromCurrency: value,
      toCurrency: value,
    },
    setState: setValue,
  });

  return { setValue };
};

describe("Select Country", () => {
  describe("Positive", () => {
    it("Country selector shows relevant country options when opened", async () => {
      const user = userEvent.setup();
      const setValue = vi.fn();
      renderSelectCountry({ setValue, label: "from" });

      const input = await screen.findByRole("combobox", { name: /from/i });
      await user.click(input);

      const [option] = await screen.findAllByRole("option", {
        name: /United States/i,
      });

      expect(option).toBeInTheDocument();
    });

    it("Country selector calls the setter with the selected country", async () => {
      const user = userEvent.setup();
      const setValue = vi.fn();
      renderSelectCountry({ setValue, label: "from" });

      const input = await screen.findByRole("combobox", { name: /from/i });
      await user.click(input);

      const [option] = await screen.findAllByRole("option", {
        name: /United States/i,
      });
      await user.click(option);

      expect(setValue).toHaveBeenCalled();
    });
  });

  describe("Negative", () => {
    it("Country selector ignores a stale or unavailable value", async () => {
      const setValue = vi.fn();
      const unavailableValue = {
        name: { common: "Not a real place" },
        flags: { png: "" },
        currencies: { USD: { name: "US Dollar", symbol: "$" } },
      };

      renderSelectCountry({ value: unavailableValue, setValue, label: "to" });

      const input = await screen.findByRole("combobox", { name: /to/i });
      expect(input).toBeInTheDocument();
      expect(
        screen.queryByDisplayValue(/Not a real place/i),
      ).not.toBeInTheDocument();
    });

    it("Country selector still renders an empty combobox when no valid match is selected", async () => {
      const setValue = vi.fn();
      renderSelectCountry({ setValue, label: "to" });
      const input = await screen.findByRole("combobox", { name: /to/i });
      expect(input).toBeInTheDocument();
    });
  });

  describe("Edge", () => {
    it("Country selector renders a neutral state while data is loading", async () => {
      const setValue = vi.fn();
      renderSelectCountry({ setValue, label: "from" });

      expect(
        screen.queryByRole("combobox", { name: /from/i }),
      ).not.toBeInTheDocument();

      const input = await screen.findByRole("combobox", { name: /from/i });
      expect(input).toBeInTheDocument();
    });

    it("Country selector preserves the selected display label format", async () => {
      const selectedValue = {
        name: { common: "United States" },
        flags: { png: "https://example.com/us.png" },
        currencies: { USD: { name: "US Dollar", symbol: "$" } },
      };

      const setValue = vi.fn();
      renderSelectCountry({ value: selectedValue, setValue, label: "from" });

      const input = await screen.findByRole("combobox", { name: /from/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("USD - United States");
    });
  });
});
