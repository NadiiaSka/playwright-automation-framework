import { test, expect } from "@playwright/test";

const selectCurrency = async (page, fieldName, optionText) => {
  const field = page.getByRole("combobox", {
    name: new RegExp(fieldName, "i"),
  });
  await field.click();
  await page
    .getByRole("option", { name: new RegExp(`^${optionText}$`, "i") })
    .click();
};

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

    await page.goto("/");
  });

  test("converts a valid amount and shows the result", async ({ page }) => {
    await page.getByLabel("Amount").fill("100");
    await selectCurrency(page, "from", "USD - United States");
    await selectCurrency(page, "to", "UAH - Ukraine");

    await expect(page.getByText(/100 USD/i)).toBeVisible();
    await expect(page.getByText(/3,?\s*820.*UAH/i)).toBeVisible();
  });

  test("swaps the source and target currencies and updates the result", async ({
    page,
  }) => {
    await page.getByLabel("Amount").fill("100");
    await selectCurrency(page, "from", "USD - United States");
    await selectCurrency(page, "to", "UAH - Ukraine");

    await page.getByRole("button", { name: /switch currencies/i }).click();

    await expect(page.getByRole("combobox", { name: /from/i })).toHaveValue(
      /UAH/i,
    );
    await expect(page.getByRole("combobox", { name: /to/i })).toHaveValue(
      /USD/i,
    );
    await expect(page.getByText(/100 UAH/i)).toBeVisible();
    await expect(page.getByText(/2\.62.*USD/i)).toBeVisible();
  });

  test("accepts zero as a valid value and shows a zero conversion result", async ({
    page,
  }) => {
    await page.getByLabel("Amount").fill("0");
    await selectCurrency(page, "from", "USD - United States");
    await selectCurrency(page, "to", "UAH - Ukraine");

    await expect(page.getByText(/0 USD/i)).toBeVisible();
    await expect(page.getByText(/0 UAH/i)).toBeVisible();
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

    await page.getByLabel("Amount").fill("100");
    await selectCurrency(page, "from", "USD - United States");
    await selectCurrency(page, "to", "UAH - Ukraine");

    await expect(
      page.getByText(/something went wrong while fetching the conversion/i),
    ).toBeVisible();
  });

  test("TEMP DEMO: fails when the conversion total is incorrect", async ({
    page,
  }) => {
    await page.getByLabel("Amount").fill("100");
    await selectCurrency(page, "from", "USD - United States");
    await selectCurrency(page, "to", "UAH - Ukraine");

    await expect(page.getByText(/3,?\s*821.*UAH/i)).toBeVisible({
      timeout: 1000,
    });
  });
});
