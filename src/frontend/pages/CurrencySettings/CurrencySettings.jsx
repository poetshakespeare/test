import React from 'react';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import styles from './CurrencySettings.module.css';

const CurrencySettings = () => {
  const { 
    selectedCurrency, 
    changeCurrency, 
    getAvailableCurrencies,
    getCurrentRate 
  } = useCurrencyContext();

  const currencies = getAvailableCurrencies();
  const currentRate = getCurrentRate();

  const handleCurrencyChange = (currencyCode) => {
    changeCurrency(currencyCode);
  };

  return (
    <div className={styles.currencySettings}>
      <div className={styles.header}>
        <h3>💱 Configuración de Moneda</h3>
        <p>Selecciona la moneda en la que deseas ver los precios</p>
      </div>

      <div className={styles.currentCurrency}>
        <h4>Moneda Actual:</h4>
        <div className={styles.currentCurrencyDisplay}>
          <span className={styles.flag}>
            {currencies.find(c => c.code === selectedCurrency)?.flag}
          </span>
          <span className={styles.currencyName}>
            {currencies.find(c => c.code === selectedCurrency)?.name}
          </span>
          <span className={styles.currencyCode}>
            ({selectedCurrency})
          </span>
        </div>
        {selectedCurrency !== 'CUP' && (
          <div className={styles.exchangeRate}>
            <span>Tasa de cambio: 1 {selectedCurrency} = {currentRate.toLocaleString()} CUP</span>
          </div>
        )}
      </div>

      <div className={styles.currencyGrid}>
        {currencies.map((currency) => (
          <div
            key={currency.code}
            className={`${styles.currencyCard} ${
              selectedCurrency === currency.code ? styles.selected : ''
            }`}
            onClick={() => handleCurrencyChange(currency.code)}
          >
            <div className={styles.currencyFlag}>{currency.flag}</div>
            <div className={styles.currencyInfo}>
              <h4>{currency.code}</h4>
              <p>{currency.name}</p>
              <span className={styles.symbol}>{currency.symbol}</span>
              {currency.code !== 'CUP' && (
                <div className={styles.rate}>
                  1 {currency.code} = {currency.rate.toLocaleString()} CUP
                </div>
              )}
            </div>
            {selectedCurrency === currency.code && (
              <div className={styles.selectedIndicator}>✓</div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.infoSection}>
        <h4>ℹ️ Información sobre las Tasas de Cambio</h4>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>🇨🇺 CUP (Peso Cubano):</strong> Moneda base del sistema
          </div>
          <div className={styles.infoItem}>
            <strong>🇺🇸 USD (Dólar Estadounidense):</strong> Tasa del mercado informal cubano
          </div>
          <div className={styles.infoItem}>
            <strong>🇪🇺 EUR (Euro):</strong> Tasa del mercado informal cubano
          </div>
          <div className={styles.infoItem}>
            <strong>🏦 MLC (Moneda Libremente Convertible):</strong> Moneda digital cubana
          </div>
        </div>
        <p className={styles.disclaimer}>
          * Las tasas de cambio están basadas en el mercado informal cubano y se actualizan según las condiciones del mercado.
        </p>
      </div>
    </div>
  );
};

export default CurrencySettings;