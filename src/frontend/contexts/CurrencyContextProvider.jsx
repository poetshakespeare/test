import React, { createContext, useContext, useState, useEffect } from 'react';
import { CURRENCIES, DEFAULT_CURRENCY, LOCAL_STORAGE_KEYS } from '../constants/constants';
import { toastHandler } from '../utils/utils';
import { ToastType } from '../constants/constants';

const CurrencyContext = createContext(null);

export const useCurrencyContext = () => useContext(CurrencyContext);

const CurrencyContextProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);

  // Cargar moneda desde localStorage al iniciar
  useEffect(() => {
    const savedCurrency = localStorage.getItem(LOCAL_STORAGE_KEYS.Currency);
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  // Función para cambiar moneda
  const changeCurrency = (currencyCode) => {
    if (CURRENCIES[currencyCode]) {
      setSelectedCurrency(currencyCode);
      localStorage.setItem(LOCAL_STORAGE_KEYS.Currency, currencyCode);
      
      const currency = CURRENCIES[currencyCode];
      toastHandler(
        ToastType.Success, 
        `💱 Moneda cambiada a ${currency.flag} ${currency.name} (${currency.code})`
      );
    }
  };

  // Función para convertir precio de CUP a la moneda seleccionada
  const convertFromCUP = (cupAmount) => {
    if (selectedCurrency === 'CUP') {
      return cupAmount;
    }
    
    const rate = CURRENCIES[selectedCurrency].rate;
    return cupAmount / rate;
  };

  // Función para convertir precio de cualquier moneda a CUP
  const convertToCUP = (amount, fromCurrency = selectedCurrency) => {
    if (fromCurrency === 'CUP') {
      return amount;
    }
    
    const rate = CURRENCIES[fromCurrency].rate;
    return amount * rate;
  };

  // Función para formatear precio SIN duplicar código de moneda
  const formatPrice = (cupAmount, showCurrency = true) => {
    const convertedAmount = convertFromCUP(cupAmount);
    const currency = CURRENCIES[selectedCurrency];
    
    // Formatear según la moneda
    let formattedAmount;
    if (selectedCurrency === 'CUP') {
      formattedAmount = convertedAmount.toLocaleString('es-CU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      formattedAmount = convertedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    if (!showCurrency) {
      return formattedAmount;
    }

    // Retornar SOLO con símbolo y código UNA VEZ
    if (selectedCurrency === 'MLC') {
      return `${formattedAmount} ${currency.symbol} ${currency.code}`;
    } else {
      return `${currency.symbol}${formattedAmount} ${currency.code}`;
    }
  };

  // Función para formatear precio con código de moneda (mantener compatibilidad)
  const formatPriceWithCode = (cupAmount) => {
    return formatPrice(cupAmount, true);
  };

  // Función para obtener información de la moneda actual
  const getCurrentCurrency = () => {
    return CURRENCIES[selectedCurrency];
  };

  // Función para obtener todas las monedas disponibles
  const getAvailableCurrencies = () => {
    return Object.values(CURRENCIES);
  };

  // Función para obtener el símbolo de la moneda actual
  const getCurrencySymbol = () => {
    return CURRENCIES[selectedCurrency].symbol;
  };

  // Función para obtener la tasa de conversión actual
  const getCurrentRate = () => {
    return CURRENCIES[selectedCurrency].rate;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      changeCurrency,
      convertFromCUP,
      convertToCUP,
      formatPrice,
      formatPriceWithCode,
      getCurrentCurrency,
      getAvailableCurrencies,
      getCurrencySymbol,
      getCurrentRate,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContextProvider;