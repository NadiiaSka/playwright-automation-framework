import { test, expect } from "@playwright/test";
import { CurrencyConverterPage } from "../pages/CurrencyConverterPage";

test.describe("Currency converter end-to-end flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/convert", async (route) => {
      const { amount, from, to } = route.request().postDataJSON();

      const rates = {
        USD: 1,
        UAH: 38.2,
        EUR: 0.92,
        GBP: 0.78,
      };

      const converted = (amount * rates[to]) / rates[from];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          convertedAmount: Number(converted.toFixed(2)),
        }),
      });
    });

    await new CurrencyConverterPage(page).goto();
  });

  test("converts a valid amount and shows the result", async ({ page }) => {
    const converter = new CurrencyConverterPage(page);
    await converter.fillAmount("100");
    await converter.selectCurrency("from", "USD - United States");
    await converter.selectCurrency("to", "UAH - Ukraine");

    await expect(
      converter.conversionHeadings.filter({ hasText: /100 USD/i }),
    ).toBeVisible();
    await expect(
      converter.conversionHeadings.filter({ hasText: /3,?\s*820.*UAH/i }),
    ).toBeVisible();
  });

  test("swaps the source and target currencies and updates the result", async ({
    page,
  }) => {
    const converter = new CurrencyConverterPage(page);
    await converter.fillAmount("100");
    await converter.selectCurrency("from", "USD - United States");
    await converter.selectCurrency("to", "UAH - Ukraine");

    await converter.swapCurrencies();

    await expect(converter.fromCurrencySelect).toHaveValue(/UAH/i);
    await expect(converter.toCurrencySelect).toHaveValue(/USD/i);
    await expect(
      converter.conversionHeadings.filter({ hasText: /100 UAH/i }),
    ).toBeVisible();
    await expect(
      converter.conversionHeadings.filter({ hasText: /2\.62.*USD/i }),
    ).toBeVisible();
  });

  test("accepts zero as a valid value and shows a zero conversion result", async ({
    page,
  }) => {
    const converter = new CurrencyConverterPage(page);
    await converter.fillAmount("0");
    await converter.selectCurrency("from", "USD - United States");
    await converter.selectCurrency("to", "UAH - Ukraine");

    await expect(
      converter.conversionHeadings.filter({ hasText: /0 USD/i }),
    ).toBeVisible();
    await expect(
      converter.conversionHeadings.filter({ hasText: /0 UAH/i }),
    ).toBeVisible();
  });

  test("shows an error state when the conversion request fails", async ({
    page,
  }) => {
    await page.unrouteAll();
    await page.route("**/api/convert", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "server error" }),
      });
    });

    const converter = new CurrencyConverterPage(page);
    await converter.fillAmount("100");
    await converter.selectCurrency("from", "USD - United States");
    await converter.selectCurrency("to", "UAH - Ukraine");

    await expect(converter.errorMessage).toBeVisible();
  });
});
