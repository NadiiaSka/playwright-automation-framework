import axios from "axios";

const exchangeRateUrl =
  import.meta.env.VITE_EXCHANGE_RATE_URL ?? "https://api.fxratesapi.com/latest";
const useLocalCurrencyApi =
  import.meta.env.VITE_USE_LOCAL_CURRENCY_API === "true" ||
  ["local", "ci"].includes(import.meta.env.MODE);

export const fetchCurrencyConversion = async (
  codeFromCurrency,
  codeToCurrency,
  firstAmount,
) => {
  if (useLocalCurrencyApi) {
    const response = await axios.post(exchangeRateUrl, {
      amount: firstAmount,
      from: codeFromCurrency,
      to: codeToCurrency,
    });

    return response.data.convertedAmount;
  }

  const response = await axios.get(exchangeRateUrl, {
    params: {
      amount: firstAmount,
      base: codeFromCurrency,
      currencies: codeToCurrency,
      resolution: "1m",
      places: 6,
      format: "json",
    },
  });
  const convertedAmount = response.data.rates[codeToCurrency];
  const convertedAmountRounded = Math.round(convertedAmount * 100) / 100;
  return convertedAmountRounded;
};
