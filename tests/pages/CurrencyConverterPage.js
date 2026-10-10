export class CurrencyConverterPage {
  constructor(page) {
    this.page = page;
  }

  get amountInput() {
    return this.page.getByLabel("Amount");
  }

  get fromCurrencySelect() {
    return this.page.getByRole("combobox", { name: /from/i });
  }

  get toCurrencySelect() {
    return this.page.getByRole("combobox", { name: /to/i });
  }

  get switchCurrenciesButton() {
    return this.page.getByRole("button", { name: /switch currencies/i });
  }

  get conversionHeadings() {
    return this.page.getByRole("heading", { level: 5 });
  }

  get errorMessage() {
    return this.page.getByText(
      /something went wrong while fetching the conversion/i,
    );
  }

  async goto() {
    await this.page.goto("/");
  }

  async fillAmount(amount) {
    await this.amountInput.fill(amount);
  }

  async selectCurrency(fieldName, optionText) {
    const field = this.page.getByRole("combobox", {
      name: new RegExp(fieldName, "i"),
    });
    await field.click();
    await this.page
      .getByRole("option", { name: new RegExp(`^${optionText}$`, "i") })
      .click();
  }

  async swapCurrencies() {
    await this.switchCurrenciesButton.click();
  }
}
