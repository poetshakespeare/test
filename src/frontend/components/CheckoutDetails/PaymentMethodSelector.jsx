import React from 'react';
import { useEffect } from 'react';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import Price from '../Price';
import styles from './PaymentMethodSelector.module.css';

const PaymentMethodSelector = ({ 
  selectedPaymentMethod, 
  setSelectedPaymentMethod, 
  availablePaymentMethods,
  cartItems 
}) => {
  const { formatPriceWithCode } = useCurrencyContext();

  // ESCUCHAR EVENTOS DE SINCRONIZACIÓN DE MÉTODOS DE PAGO
  useEffect(() => {
    const handlePaymentConfigSync = (event) => {
      const { type } = event.detail;
      if (type === 'paymentconfig' || type === 'products') {
        console.log('📡 Sincronización de configuración de pagos detectada en PaymentMethodSelector');
        // Forzar re-evaluación de métodos de pago disponibles
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    window.addEventListener('adminPanelSync', handlePaymentConfigSync);

    return () => {
      window.removeEventListener('adminPanelSync', handlePaymentConfigSync);
    };
  }, []);
  // Calcular totales por método de pago
  const calculatePaymentTotals = () => {
    let cashTotal = 0;
    let transferTotal = 0;
    let transferFees = 0;

    cartItems.forEach(item => {
      const paymentType = item.paymentType || 'both';
      const transferFeePercentage = item.transferFeePercentage || 5;
      const itemTotal = item.price * item.qty;

      // Para efectivo
      if (paymentType === 'cash' || paymentType === 'both') {
        cashTotal += itemTotal;
      }

      // Para transferencia
      if (paymentType === 'transfer' || paymentType === 'both') {
        const fee = (itemTotal * transferFeePercentage) / 100;
        transferFees += fee;
        transferTotal += itemTotal + fee;
      }
    });

    return { cashTotal, transferTotal, transferFees };
  };

  const { cashTotal, transferTotal, transferFees } = calculatePaymentTotals();

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  return (
    <div className={styles.paymentSelector}>
      <div className={styles.selectorHeader}>
        <h4>💳 Selecciona tu Método de Pago</h4>
        <p>Elige cómo deseas pagar tus productos</p>
      </div>

      <div className={styles.paymentOptions}>
        {/* Opción de Efectivo */}
        <div 
          className={`${styles.paymentOption} ${
            selectedPaymentMethod === 'cash' ? styles.selected : ''
          } ${!availablePaymentMethods.cash ? styles.disabled : ''}`}
          onClick={() => availablePaymentMethods.cash && handlePaymentMethodChange('cash')}
        >
          <div className={styles.optionHeader}>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={selectedPaymentMethod === 'cash'}
              onChange={() => handlePaymentMethodChange('cash')}
              disabled={!availablePaymentMethods.cash}
              className={styles.radioInput}
            />
            <div className={styles.optionTitle}>
              <span className={styles.paymentIcon}>💰</span>
              <span className={styles.paymentName}>Pago en Efectivo</span>
              {!availablePaymentMethods.cash && (
                <span className={styles.lockIcon}>🔒</span>
              )}
            </div>
          </div>
          
          <div className={styles.optionDetails}>
            <p className={styles.optionDescription}>
              Paga directamente en efectivo al recibir tu pedido
            </p>
            {availablePaymentMethods.cash && (
              <div className={styles.priceDisplay}>
                <span className={styles.totalLabel}>Total a pagar:</span>
                <Price amount={cashTotal} />
              </div>
            )}
            {!availablePaymentMethods.cash && (
              <div className={styles.unavailableMessage}>
                ⚠️ Algunos productos en tu carrito solo aceptan transferencia bancaria
              </div>
            )}
          </div>
        </div>

        {/* Opción de Transferencia */}
        <div 
          className={`${styles.paymentOption} ${
            selectedPaymentMethod === 'transfer' ? styles.selected : ''
          } ${!availablePaymentMethods.transfer ? styles.disabled : ''}`}
          onClick={() => availablePaymentMethods.transfer && handlePaymentMethodChange('transfer')}
        >
          <div className={styles.optionHeader}>
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={selectedPaymentMethod === 'transfer'}
              onChange={() => handlePaymentMethodChange('transfer')}
              disabled={!availablePaymentMethods.transfer}
              className={styles.radioInput}
            />
            <div className={styles.optionTitle}>
              <span className={styles.paymentIcon}>💳</span>
              <span className={styles.paymentName}>Transferencia Bancaria</span>
              {!availablePaymentMethods.transfer && (
                <span className={styles.lockIcon}>🔒</span>
              )}
            </div>
          </div>
          
          <div className={styles.optionDetails}>
            <p className={styles.optionDescription}>
              Paga por transferencia bancaria con recargo aplicado
            </p>
            {availablePaymentMethods.transfer && (
              <div className={styles.transferBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Subtotal productos:</span>
                  <Price amount={cashTotal} />
                </div>
                {transferFees > 0 && (
                  <div className={styles.breakdownRow}>
                    <span>Recargo por transferencia:</span>
                    <Price amount={transferFees} />
                  </div>
                )}
                <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
                  <span className={styles.totalLabel}>Total con transferencia:</span>
                  <Price amount={transferTotal} />
                </div>
              </div>
            )}
            {!availablePaymentMethods.transfer && (
              <div className={styles.unavailableMessage}>
                ⚠️ Algunos productos en tu carrito solo aceptan pago en efectivo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className={styles.paymentInfo}>
        <h5>ℹ️ Información sobre Métodos de Pago</h5>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>💰 Pago en Efectivo:</strong> Sin recargos adicionales, pago directo al recibir
          </div>
          <div className={styles.infoItem}>
            <strong>💳 Transferencia Bancaria:</strong> Incluye recargo según configuración de cada producto
          </div>
          <div className={styles.infoItem}>
            <strong>🔒 Restricciones:</strong> Algunos productos pueden tener métodos de pago específicos
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;