import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import { SERVICE_TYPES, ToastType } from '../../constants/constants';
import { toastHandler, generateOrderNumber, Popper } from '../../utils/utils';
import Price from '../Price';
import CouponSearch from './CouponSearch';
import styles from './CheckoutDetails.module.css';

const CheckoutDetails = ({ activeAddressId, updateCheckoutStatus, timer }) => {
  const navigate = useNavigate();
  const { 
    cart: cartFromContext, 
    cartDetails: { totalAmount: totalAmountFromContext },
    clearCartDispatch,
    addressList: addressListFromContext 
  } = useAllProductsContext();

  const { storeConfig } = useConfigContext();
  const { formatPrice } = useCurrencyContext();

  const [activeCoupon, setActiveCoupon] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const SANTIAGO_ZONES = storeConfig.zones || [];
  const STORE_WHATSAPP = storeConfig.storeInfo?.whatsappNumber || '+53 54690878';

  // Encontrar la dirección activa
  const activeAddress = addressListFromContext.find(
    address => address.addressId === activeAddressId
  );

  // Calcular costo de entrega
  const deliveryCost = activeAddress?.serviceType === SERVICE_TYPES.HOME_DELIVERY
    ? SANTIAGO_ZONES.find(zone => zone.id === activeAddress.zone)?.cost || 0
    : 0;

  // Calcular descuento del cupón
  const couponDiscount = activeCoupon 
    ? Math.floor((totalAmountFromContext * activeCoupon.discountPercent) / 100)
    : 0;

  // Calcular total final
  const finalTotal = totalAmountFromContext + deliveryCost - couponDiscount;

  const updateActiveCoupon = (coupon) => {
    setActiveCoupon(coupon);
  };

  const generateWhatsAppMessage = () => {
    const orderNumber = generateOrderNumber();
    const orderDate = new Date().toLocaleDateString('es-ES');
    
    let message = `🛒 *NUEVO PEDIDO - ${orderNumber}*\n`;
    message += `📅 Fecha: ${orderDate}\n\n`;
    
    // Información del cliente
    message += `👤 *DATOS DEL CLIENTE:*\n`;
    message += `Nombre: ${activeAddress.username}\n`;
    message += `Móvil: ${activeAddress.mobile}\n\n`;
    
    // Tipo de servicio
    message += `🚚 *TIPO DE SERVICIO:*\n`;
    if (activeAddress.serviceType === SERVICE_TYPES.HOME_DELIVERY) {
      const zoneName = SANTIAGO_ZONES.find(z => z.id === activeAddress.zone)?.name;
      message += `Entrega a domicilio\n`;
      message += `Zona: ${zoneName}\n`;
      message += `Dirección: ${activeAddress.addressInfo}\n`;
      message += `Recibe: ${activeAddress.receiverName}\n`;
      message += `Teléfono: ${activeAddress.receiverPhone}\n\n`;
    } else {
      message += `Recoger en local\n`;
      if (activeAddress.additionalInfo) {
        message += `Info adicional: ${activeAddress.additionalInfo}\n`;
      }
      message += `\n`;
    }
    
    // Productos
    message += `📦 *PRODUCTOS:*\n`;
    cartFromContext.forEach((item, index) => {
      const colorName = item.colors[0]?.color || 'Sin color';
      message += `${index + 1}. ${item.name}\n`;
      message += `   Color: ${colorName}\n`;
      message += `   Cantidad: ${item.qty}\n`;
      message += `   Precio: ${formatPrice(item.price * item.qty)}\n\n`;
    });
    
    // Resumen de precios
    message += `💰 *RESUMEN DE PRECIOS:*\n`;
    message += `Subtotal: ${formatPrice(totalAmountFromContext)}\n`;
    
    if (deliveryCost > 0) {
      message += `Envío: ${formatPrice(deliveryCost)}\n`;
    }
    
    if (activeCoupon) {
      message += `Cupón (${activeCoupon.couponCode}): -${formatPrice(couponDiscount)}\n`;
    }
    
    message += `*TOTAL: ${formatPrice(finalTotal)}*\n\n`;
    message += `¡Gracias por tu pedido! 🎉`;
    
    return encodeURIComponent(message);
  };

  const handleOrderSubmit = async () => {
    if (!activeAddressId) {
      toastHandler(ToastType.Error, 'Por favor selecciona una dirección de entrega');
      return;
    }

    if (cartFromContext.length === 0) {
      toastHandler(ToastType.Error, 'Tu carrito está vacío');
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Simular procesamiento del pedido
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar mensaje de WhatsApp
      const whatsappMessage = generateWhatsAppMessage();
      
      // URLs de WhatsApp para diferentes métodos
      const whatsappUrls = [
        `https://wa.me/${STORE_WHATSAPP.replace(/[^\d]/g, '')}?text=${whatsappMessage}`,
        `https://api.whatsapp.com/send?phone=${STORE_WHATSAPP.replace(/[^\d]/g, '')}&text=${whatsappMessage}`,
        `whatsapp://send?phone=${STORE_WHATSAPP.replace(/[^\d]/g, '')}&text=${whatsappMessage}`
      ];

      // Intentar abrir WhatsApp
      let whatsappOpened = false;
      
      for (let i = 0; i < whatsappUrls.length; i++) {
        try {
          const newWindow = window.open(whatsappUrls[i], '_blank');
          
          if (newWindow && !newWindow.closed) {
            whatsappOpened = true;
            break;
          }
          
          // Si no se pudo abrir y hay más URLs, continuar
          if (i < whatsappUrls.length - 1) {
            console.log('🔄 Intentando siguiente método...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error con método ${i + 1}:`, error);
          
          if (i < whatsappUrls.length - 1) {
            console.log('🔄 Intentando siguiente método...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // Si no se pudo abrir WhatsApp automáticamente
      if (!whatsappOpened) {
        const fallbackUrl = whatsappUrls[0];
        toastHandler(
          ToastType.Info, 
          'Si WhatsApp no se abrió automáticamente, copia el enlace del portapapeles'
        );
        
        // Intentar copiar al portapapeles
        try {
          await navigator.clipboard.writeText(fallbackUrl);
          toastHandler(ToastType.Success, 'Enlace de WhatsApp copiado al portapapeles');
        } catch (clipboardError) {
          console.error('Error al copiar al portapapeles:', clipboardError);
        }
        
        // Abrir en la misma pestaña como último recurso
        window.location.href = fallbackUrl;
      }

      // Limpiar carrito y mostrar éxito
      await clearCartDispatch();
      
      // Efectos visuales de éxito
      Popper();
      toastHandler(ToastType.Success, '🎉 ¡Pedido enviado exitosamente por WhatsApp!');
      
      // Actualizar estado de checkout
      timer.current = setTimeout(() => {
        updateCheckoutStatus({ showSuccessMsg: true });
      }, 1500);

    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      toastHandler(ToastType.Error, 'Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <article className={styles.checkout}>
      <div className={styles.checkoutHeader}>
        <h3 className={styles.priceTitle}>
          <span className={styles.titleIcon}>💰</span>
          <span className={styles.titleText}>Detalles del Precio</span>
          <div className={styles.titleUnderline}></div>
        </h3>
      </div>

      <CouponSearch 
        activeCoupon={activeCoupon} 
        updateActiveCoupon={updateActiveCoupon} 
      />

      <div className={styles.priceBreakdown}>
        {/* Productos */}
        {cartFromContext.map(({ _id, name, qty, price, colors }) => (
          <div key={_id} className={styles.row}>
            <span>
              {name} ({qty}x)
              <div
                style={{ 
                  background: colors[0]?.color,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginLeft: '8px',
                  border: '1px solid #ccc'
                }}
              ></div>
            </span>
            <Price amount={price * qty} />
          </div>
        ))}

        <hr />

        {/* Subtotal */}
        <div className={styles.row}>
          <span>Subtotal:</span>
          <Price amount={totalAmountFromContext} />
        </div>

        {/* Costo de entrega */}
        {deliveryCost > 0 && (
          <div className={styles.row}>
            <span>Costo de entrega:</span>
            <Price amount={deliveryCost} />
          </div>
        )}

        {/* Descuento del cupón */}
        {activeCoupon && (
          <div className={styles.row}>
            <span>Descuento ({activeCoupon.couponCode}):</span>
            <Price amount={-couponDiscount} className="text-green" />
          </div>
        )}
      </div>

      {/* Total final */}
      <div className={styles.totalPrice}>
        <span>Total Final:</span>
        <Price amount={finalTotal} />
      </div>

      {/* Botón de pedido */}
      <button
        onClick={handleOrderSubmit}
        disabled={!activeAddressId || cartFromContext.length === 0 || isProcessingOrder}
        className={`${styles.orderBtn} ${isProcessingOrder ? styles.processing : ''}`}
      >
        {isProcessingOrder ? (
          <div className={styles.processingContent}>
            <div className={styles.spinner}></div>
            <span>Procesando pedido...</span>
          </div>
        ) : (
          <>
            <span className={styles.whatsappIcon}>📱</span>
            <span>Realizar Pedido por WhatsApp</span>
          </>
        )}
      </button>

      {!activeAddressId && (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
          Selecciona una dirección para continuar
        </p>
      )}
    </article>
  );
};

export default CheckoutDetails;