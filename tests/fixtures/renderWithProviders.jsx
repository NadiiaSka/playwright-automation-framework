import { render } from "@testing-library/react";
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "react-query";
import { CurrencyContext } from "../../src/context/CurrencyContext";
import { defaultCurrencyState } from "./defaultCurrencyState";

export const renderWithProviders = ({
  ui,
  initialValues = defaultCurrencyState,
  setState = () => undefined,
  setters = {},
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const value = {
    fromCurrency: initialValues.fromCurrency,
    setFromCurrency: setters.setFromCurrency ?? setState,
    toCurrency: initialValues.toCurrency,
    setToCurrency: setters.setToCurrency ?? setState,
    firstAmount: initialValues.firstAmount,
    setFirstAmount: setters.setFirstAmount ?? setState,
  };

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <CurrencyContext.Provider value={value}>
        {children}
      </CurrencyContext.Provider>
    </QueryClientProvider>
  );
  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return render(ui, { wrapper: Wrapper });
};
