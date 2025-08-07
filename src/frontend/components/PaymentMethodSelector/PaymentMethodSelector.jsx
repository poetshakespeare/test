import React, { useState, useEffect } from 'react';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { toastHandler } from '../../utils/utils';
import { ToastType } from '../../constants/constants';
import Price from '../Price';
import styles from './PaymentMethodSelector.module.css';

const PaymentMethodSelector = ({ onPaymentMethodChange, selectedMethod = 'cash' }) => {
  const [paymentMethod, setPaymentMethod] = useState(selectedMethod);
  const [isAnimating, setIsAnimating] = useState(false);
  const { formatPriceWithCode, getCurrentCurrency } = useCurrencyContext();
  const { cart, cartDetails: { totalAmount } } = useAllProductsContext();

  // Calcular recargo del 20% para transferencia bancaria
  const bankTransferFee = totalAmount * 0.20;
  const totalWithBankFee = totalAmount + bankTransferFee;

  const handlePaymentMethodChange = (method) => {
    if (method === paymentMethod) return;

    setIsAnimating(true);
    
    setTimeout(() => {
      setPaymentMethod(method);
      setIsAnimating(false);
      
      // Notificar al componente padre
      if (onPaymentMethodChange) {
        onPaymentMethodChange({
          method,
          fee: method === 'bank_transfer' ? bankTransferFee : 0,
          total: method === 'bank_transfer' ? totalWithBankFee : totalAmount
        });
      }

      // Mostrar notificación animada
      const currency = getCurrentCurrency();
      if (method === 'bank_transfer') {
        toastHandler(
          ToastType.Info, 
          `💳 Transferencia bancaria activada: +20% de recargo (${formatPriceWithCode(bankTransferFee)})`
        );
      } else {
        toastHandler(
          ToastType.Success, 
          `💰 Pago en efectivo activado: Sin recargos adicionales`
        );
      }
    }, 300);
  };

  useEffect(() => {
    // Notificar cambio inicial
    if (onPaymentMethodChange) {
      onPaymentMethodChange({
        method: paymentMethod,
        fee: paymentMethod === 'bank_transfer' ? bankTransferFee : 0,
        total: paymentMethod === 'bank_transfer' ? totalWithBankFee : totalAmount
      });
    }
  }, [totalAmount]); // Recalcular cuando cambie el total del carrito

  return (
    <div className={styles.paymentSelector}>
      <div className={styles.selectorHeader}>
        <h4>💳 Método de Pago</h4>
        <p>Selecciona cómo deseas realizar el pago</p>
      </div>

      <div className={styles.paymentOptions}>
        {/* Opción Pago en Efectivo */}
        <div className={`${styles.paymentOption} ${paymentMethod === 'cash' ? styles.active : ''}`}>
          <div className={styles.optionHeader}>
            <div className={styles.optionIcon}>💰</div>
            <div className={styles.optionInfo}>
              <h5>Pago en Efectivo</h5>
              <p>Pago directo en la tienda</p>
            </div>
            <div className={styles.switchContainer}>
              <input
                type="radio"
                id="cash-payment"
                name="paymentMethod"
                checked={paymentMethod === 'cash'}
                onChange={() => handlePaymentMethodChange('cash')}
                className={styles.switchInput}
              />
              <label htmlFor="cash-payment" className={styles.switch}>
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
          
          {paymentMethod === 'cash' && (
            <div className={`${styles.paymentDetails} ${isAnimating ? styles.animating : ''}`}>
              <div className={styles.cashDetails}>
                <div className={styles.benefitsList}>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>✅</span>
                    <span>Sin recargos adicionales</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>🏪</span>
                    <span>Pago directo en la tienda</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>💵</span>
                    <span>Efectivo en cualquier moneda</span>
                  </div>
                  <div className={styles.benefit}>
                    <span className={styles.benefitIcon}>⚡</span>
                    <span>Proceso rápido y seguro</span>
                  </div>
                </div>
                
                <div className={styles.totalDisplay}>
                  <div className={styles.totalLabel}>Total a Pagar:</div>
                  <div className={styles.totalAmount}>
                    <Price amount={totalAmount} showCurrencyCode={true} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opción Transferencia Bancaria */}
        <div className={`${styles.paymentOption} ${paymentMethod === 'bank_transfer' ? styles.active : ''}`}>
          <div className={styles.optionHeader}>
            <div className={styles.optionIcon}>🏦</div>
            <div className={styles.optionInfo}>
              <h5>Transferencia Bancaria</h5>
              <p>Pago por transferencia (+20% recargo)</p>
            </div>
            <div className={styles.switchContainer}>
              <input
                type="radio"
                id="bank-transfer"
                name="paymentMethod"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => handlePaymentMethodChange('bank_transfer')}
                className={styles.switchInput}
              />
              <label htmlFor="bank-transfer" className={styles.switch}>
                <span className={styles.switchSlider}></span>
              </label>
            </div>
          </div>
          
          {paymentMethod === 'bank_transfer' && (
            <div className={`${styles.paymentDetails} ${isAnimating ? styles.animating : ''}`}>
              <div className={styles.bankDetails}>
                <div className={styles.feeNotification}>
                  <div className={styles.feeIcon}>⚠️</div>
                  <div className={styles.feeText}>
                    <strong>Recargo por Transferencia Bancaria: +20%</strong>
                    <p>Se aplica un recargo del 20% sobre el total de productos</p>
                  </div>
                </div>

                <div className={styles.priceBreakdown}>
                  <div className={styles.breakdownRow}>
                    <span>💰 Subtotal productos:</span>
                    <Price amount={totalAmount} showCurrencyCode={true} />
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>🏦 Recargo transferencia (20%):</span>
                    <span className={styles.feeAmount}>
                      +<Price amount={bankTransferFee} showCurrencyCode={true} />
                    </span>
                  </div>
                  <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
                    <span>💳 Total con transferencia:</span>
                    <div className={styles.totalWithFee}>
                      <Price amount={totalWithBankFee} showCurrencyCode={true} />
                    </div>
                  </div>
                </div>

                <div className={styles.bankInfo}>
                  <h6>📋 Información Bancaria:</h6>
                  <div className={styles.bankDetails}>
                    <div className={styles.bankItem}>
                      <span className={styles.bankLabel}>🏦 Banco:</span>
                      <span>Banco Popular de Ahorro (BPA)</span>
                    </div>
                    <div className={styles.bankItem}>
                      <span className={styles.bankLabel}>💳 Cuenta:</span>
                      <span>9205-9876-5432-1098</span>
                    </div>
                    <div className={styles.bankItem}>
                      <span className={styles.bankLabel}>👤 Titular:</span>
                      <span>Yero Shop S.A.</span>
                    </div>
                    <div className={styles.bankItem}>
                      <span className={styles.bankLabel}>🆔 CI:</span>
                      <span>12345678901</span>
                    </div>
                  </div>
                </div>

                <div className={styles.transferInstructions}>
                  <h6>📝 Instrucciones:</h6>
                  <ol>
                    <li>Realiza la transferencia por el monto total</li>
                    <li>Envía el comprobante por WhatsApp</li>
                    <li>Incluye tu número de pedido en el concepto</li>
                    <li>Espera confirmación antes de recoger</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen visual del método seleccionado */}
      <div className={styles.selectedMethodSummary}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryIcon}>
            {paymentMethod === 'cash' ? '💰' : '🏦'}
          </span>
          <span className={styles.summaryText}>
            Método seleccionado: {paymentMethod === 'cash' ? 'Pago en Efectivo' : 'Transferencia Bancaria'}
          </span>
        </div>
        
        <div className={styles.summaryAmount}>
          <span className={styles.summaryLabel}>Total a pagar:</span>
          <span className={`${styles.summaryTotal} ${paymentMethod === 'bank_transfer' ? styles.withFee : ''}`}>
            <Price 
              amount={paymentMethod === 'bank_transfer' ? totalWithBankFee : totalAmount} 
              showCurrencyCode={true} 
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;