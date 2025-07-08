import { useCurrencyContext } from '../contexts/CurrencyContextProvider';

/* eslint-disable react/prop-types */
const Price = ({ amount, showCurrency = true, showCurrencyCode = false, className = '' }) => {
  const { formatPrice, getCurrentCurrency } = useCurrencyContext();
  
  if (!amount && amount !== 0) {
    return <span className={className}>--</span>;
  }
  
  const isAmountNegative = amount < 0;
  const amountOnUI = isAmountNegative ? -1 * amount : amount;

  // Formatear precio con control de código de moneda
  const formattedPrice = formatPrice(amountOnUI, showCurrency);
  const currency = getCurrentCurrency();

  // Solo agregar código si se solicita explícitamente
  const finalPrice = showCurrencyCode 
    ? `${formattedPrice} ${currency.code}`
    : formattedPrice;

  return (
    <span className={className}>
      {isAmountNegative && '-'} {finalPrice}
    </span>
  );
};

export default Price;