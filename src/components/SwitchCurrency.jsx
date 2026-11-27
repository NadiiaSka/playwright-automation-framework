import { Button, Grid } from "@mui/material";
import { CompareArrows as CompareArrowsIcon } from "@mui/icons-material";
import { CurrencyContext } from "../context/CurrencyContext";
import { useContext } from "react";

const SwitchCurrency = () => {
  const { fromCurrency, setFromCurrency, toCurrency, setToCurrency } =
    useContext(CurrencyContext);

  const handleSwitch = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <Grid item xs={12} md="auto">
      <Button
        aria-label="Switch currencies"
        onClick={handleSwitch}
        sx={{ borderRadius: 1, height: "100%" }}
      >
        <CompareArrowsIcon sx={{ fontSize: 30 }} />
      </Button>
    </Grid>
  );
};

export default SwitchCurrency;
