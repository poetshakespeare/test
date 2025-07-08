import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import Price from '../Price';
import styles from './CheckoutDetails.module.css';
import { useState } from 'react';
import { VscChromeClose } from 'react-icons/vsc';

import { CHARGE_AND_DISCOUNT, ToastType, SERVICE_TYPES, PRODUCT_CATEGORY_ICONS } from '../../constants/constants';
import CouponSearch from './CouponSearch';
import { toastHandler, Popper, generateOrderNumber } from '../../utils/utils';

import { useAuthContext } from '../../contexts/AuthContextProvider';
import { useNavigate } from 'react-router-dom';

const CheckoutDetails = ({
  timer,
  activeAddressId: activeAddressIdFromProps,
  updateCheckoutStatus,
}) => {
  const {
    cartDetails: {
      totalAmount: totalAmountFromContext,
      totalCount: totalCountFromContext,
    },
    addressList: addressListFromContext,
    cart: cartFromContext,
    clearCartDispatch,
  } = useAllProductsContext();

  const { storeConfig } = useConfigContext();
  const { formatPriceWithCode, getCurrentCurrency, convertFromCUP } = useCurrencyContext();
  const STORE_WHATSAPP = storeConfig.storeInfo?.whatsappNumber || '+53 54690878';
  const SANTIAGO_ZONES = storeConfig.zones || [];

  const {
    user: { firstName, lastName, email },
  } = useAuthContext();
  const navigate = useNavigate();
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Obtener la dirección seleccionada
  const selectedAddress = addressListFromContext.find(
    ({ addressId }) => addressId === activeAddressIdFromProps
  );

  // Calcular costo de entrega
  const deliveryCost = selectedAddress?.serviceType === SERVICE_TYPES.HOME_DELIVERY 
    ? (selectedAddress?.deliveryCost || 0)
    : 0;

  // Calcular descuento del cupón según la moneda seleccionada
  const priceAfterCouponApplied = activeCoupon
    ? -Math.floor((totalAmountFromContext * activeCoupon.discountPercent) / 100)
    : 0;

  const finalPriceToPay =
    totalAmountFromContext +
    deliveryCost +
    CHARGE_AND_DISCOUNT.discount +
    priceAfterCouponApplied;

  const updateActiveCoupon = (couponObjClicked) => {
    setActiveCoupon(couponObjClicked);
    
    // Notificación mejorada con información de descuento y moneda
    const currency = getCurrentCurrency();
    const discountAmount = Math.floor((totalAmountFromContext * couponObjClicked.discountPercent) / 100);
    
    toastHandler(
      ToastType.Success, 
      `🎫 Cupón ${couponObjClicked.couponCode} aplicado: ${couponObjClicked.discountPercent}% de descuento (${formatPriceWithCode(discountAmount)})`
    );
  };

  const cancelCoupon = () => {
    const currency = getCurrentCurrency();
    toastHandler(ToastType.Warn, `🗑️ Cupón removido - Descuento cancelado`);
    setActiveCoupon(null);
  };

  // Función para obtener icono según categoría del producto
  const getProductIcon = (category) => {
    const normalizedCategory = category.toLowerCase();
    return PRODUCT_CATEGORY_ICONS[normalizedCategory] || PRODUCT_CATEGORY_ICONS.default;
  };

  // FUNCIÓN MEJORADA PARA DETECTAR DISPOSITIVOS Y SISTEMAS OPERATIVOS
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detectar iOS (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Detectar macOS
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    
    // Detectar Android
    const isAndroid = /Android/.test(userAgent);
    
    // Detectar Windows
    const isWindows = /Windows/.test(userAgent);
    
    // Detectar si es móvil en general
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
    
    // Detectar si tiene WhatsApp instalado (aproximación)
    const hasWhatsApp = isMobile;
    
    return {
      isIOS,
      isMacOS,
      isAndroid,
      isWindows,
      isMobile,
      hasWhatsApp,
      isAppleDevice: isIOS || isMacOS
    };
  };

  // FUNCIÓN MEJORADA PARA GENERAR URL DE WHATSAPP COMPATIBLE CON TODOS LOS DISPOSITIVOS
  const generateWhatsAppURL = (message, phoneNumber) => {
    const device = detectDevice();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    console.log('🔍 Dispositivo detectado:', device);
    console.log('📱 Número limpio:', cleanPhone);
    
    // Para dispositivos iOS (iPhone, iPad)
    if (device.isIOS) {
      // Intentar múltiples métodos para iOS
      const iosUrls = [
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
      
      console.log('📱 URLs para iOS generadas:', iosUrls);
      return iosUrls;
    }
    
    // Para macOS (Safari, Chrome en Mac)
    if (device.isMacOS) {
      const macUrls = [
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
      
      console.log('💻 URLs para macOS generadas:', macUrls);
      return macUrls;
    }
    
    // Para Android
    if (device.isAndroid) {
      const androidUrls = [
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
      
      console.log('🤖 URLs para Android generadas:', androidUrls);
      return androidUrls;
    }
    
    // Para Windows y otros sistemas
    const defaultUrls = [
      `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
      `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
      `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    ];
    
    console.log('🖥️ URLs por defecto generadas:', defaultUrls);
    return defaultUrls;
  };

  // FUNCIÓN MEJORADA PARA INTENTAR ABRIR WHATSAPP CON MÚLTIPLES MÉTODOS
  const tryOpenWhatsApp = async (urls, orderNumber) => {
    const device = detectDevice();
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`🔄 Intentando método ${i + 1}/${urls.length}:`, url);
      
      try {
        // Para dispositivos iOS, usar un enfoque especial
        if (device.isIOS && i === 0) {
          // Primer intento: URL scheme de WhatsApp
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          // Limpiar después de un tiempo
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
          
          // Esperar un poco para ver si funciona
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Si llegamos aquí, probablemente funcionó
          console.log('✅ Método iOS iframe exitoso');
          return true;
        }
        
        // Para todos los dispositivos: intentar abrir en nueva ventana/pestaña
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          console.log('✅ Ventana abierta exitosamente');
          
          // Para dispositivos móviles, cerrar la ventana después de un tiempo
          if (device.isMobile) {
            setTimeout(() => {
              try {
                newWindow.close();
              } catch (e) {
                console.log('ℹ️ No se pudo cerrar la ventana automáticamente');
              }
            }, 3000);
          }
          
          return true;
        }
        
        console.log('⚠️ No se pudo abrir ventana, intentando siguiente método...');
        
      } catch (error) {
        console.log(`❌ Error en método ${i + 1}:`, error);
        
        // Si no es el último intento, continuar
        if (i < urls.length - 1) {
          console.log('🔄 Intentando siguiente método...');
          continue;
        }
      }
      
      // Pequeña pausa entre intentos
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Si todos los métodos fallaron
    console.log('❌ Todos los métodos fallaron');
    return false;
  };

  const sendToWhatsApp = async (orderData) => {
    const orderNumber = generateOrderNumber();
    const currency = getCurrentCurrency();
    const device = detectDevice();
    
    console.log('🚀 Iniciando envío a WhatsApp...');
    console.log('📱 Dispositivo:', device);
    console.log('📞 Número de WhatsApp:', STORE_WHATSAPP);
    
    let message = `🛒 *NUEVO PEDIDO #${orderNumber}*\n\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `👤 *INFORMACIÓN DEL CLIENTE*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `📝 *Nombre Completo:* ${firstName} ${lastName}\n`;
    message += `📧 *Correo Electrónico:* ${email}\n`;
    message += `💱 *Moneda seleccionada:* ${currency.flag} ${currency.name} (${currency.code})\n\n`;
    
    // Información del servicio con mejor formato
    message += `🚚 *DETALLES DE ENTREGA*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    
    if (selectedAddress.serviceType === SERVICE_TYPES.HOME_DELIVERY) {
      const zoneName = SANTIAGO_ZONES.find(z => z.id === selectedAddress.zone)?.name;
      message += `📦 *Modalidad:* Entrega a domicilio\n`;
      message += `📍 *Zona de entrega:* ${zoneName}\n`;
      message += `🏠 *Dirección completa:* ${selectedAddress.addressInfo}\n`;
      message += `👤 *Persona que recibe:* ${selectedAddress.receiverName}\n`;
      message += `📱 *Teléfono del receptor:* ${selectedAddress.receiverPhone}\n`;
      message += `💰 *Costo de entrega:* ${formatPriceWithCode(deliveryCost)}\n`;
    } else {
      message += `📦 *Modalidad:* Recoger en tienda\n`;
      message += `🏪 *Ubicación:* Yero Shop! - Santiago de Cuba\n`;
      if (selectedAddress.additionalInfo) {
        message += `📝 *Información adicional:* ${selectedAddress.additionalInfo}\n`;
      }
    }
    
    message += `📞 *Teléfono de contacto:* ${selectedAddress.mobile}\n\n`;
    
    // Productos con iconos y mejor formato
    message += `🛍️ *PRODUCTOS SOLICITADOS*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    cartFromContext.forEach((item, index) => {
      const productIcon = getProductIcon(item.category);
      const colorHex = item.colors[0]?.color || '#000000';
      const subtotal = item.price * item.qty;
      
      message += `${index + 1}. ${productIcon} *${item.name}*\n`;
      message += `   🎨 *Color:* ${colorHex}\n`;
      message += `   📊 *Cantidad:* ${item.qty} unidad${item.qty > 1 ? 'es' : ''}\n`;
      message += `   💵 *Precio unitario:* ${formatPriceWithCode(item.price)}\n`;
      message += `   💰 *Subtotal:* ${formatPriceWithCode(subtotal)}\n`;
      message += `   ─────────────────────────────────────────────────────────\n`;
    });
    
    // Resumen financiero profesional
    message += `\n💳 *RESUMEN FINANCIERO*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🛍️ *Subtotal productos:* ${formatPriceWithCode(totalAmountFromContext)}\n`;
    
    if (activeCoupon) {
      message += `🎫 *Descuento aplicado (${activeCoupon.couponCode} - ${activeCoupon.discountPercent}%):* -${formatPriceWithCode(Math.abs(priceAfterCouponApplied))}\n`;
    }
    
    if (deliveryCost > 0) {
      message += `🚚 *Costo de entrega:* ${formatPriceWithCode(deliveryCost)}\n`;
    }
    
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `💰 *TOTAL A PAGAR: ${formatPriceWithCode(finalPriceToPay)}*\n`;
    message += `💱 *Moneda: ${currency.flag} ${currency.name} (${currency.code})*\n`;
    message += `═══════════════════════════════════════════════════════════════\n\n`;
    
    // Información adicional profesional
    message += `📅 *Fecha y hora del pedido:*\n`;
    message += `${new Date().toLocaleString('es-CU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Havana'
    })}\n\n`;
    
    message += `📋 *Instrucciones importantes:*\n`;
    message += `• Confirme la disponibilidad de los productos\n`;
    message += `• Verifique la dirección de entrega\n`;
    message += `• Coordine horario de entrega/recogida\n`;
    message += `• Mantenga este número de pedido para referencia\n`;
    message += `• Los precios están en ${currency.name} (${currency.code})\n\n`;
    
    message += `🏪 *Yero Shop!*\n`;
    message += `"La tienda online de compras hecha a tu medida" ✨\n`;
    message += `📍 Santiago de Cuba, Cuba\n`;
    message += `📱 WhatsApp: ${STORE_WHATSAPP}\n`;
    message += `🌐 Tienda online: https://yeroshop.vercel.app\n\n`;
    message += `¡Gracias por confiar en nosotros! 🙏\n`;
    message += `Su satisfacción es nuestra prioridad 💯`;

    // Generar URLs según el dispositivo
    const whatsappUrls = generateWhatsAppURL(message, STORE_WHATSAPP);
    
    // Mostrar notificación específica según el dispositivo
    if (device.isAppleDevice) {
      toastHandler(ToastType.Info, `📱 Abriendo WhatsApp en dispositivo Apple...`);
    } else if (device.isAndroid) {
      toastHandler(ToastType.Info, `🤖 Abriendo WhatsApp en Android...`);
    } else {
      toastHandler(ToastType.Info, `💻 Abriendo WhatsApp Web...`);
    }
    
    // Intentar abrir WhatsApp con múltiples métodos
    const success = await tryOpenWhatsApp(whatsappUrls, orderNumber);
    
    if (success) {
      console.log('✅ WhatsApp abierto exitosamente');
      toastHandler(ToastType.Success, `✅ Pedido #${orderNumber} enviado a WhatsApp`);
    } else {
      console.log('❌ No se pudo abrir WhatsApp automáticamente');
      
      // Fallback: mostrar información manual
      const fallbackMessage = device.isAppleDevice 
        ? `📱 Por favor, abre WhatsApp manualmente y envía un mensaje a ${STORE_WHATSAPP} con el número de pedido #${orderNumber}`
        : `💻 Por favor, abre WhatsApp Web o la aplicación y contacta a ${STORE_WHATSAPP} con el pedido #${orderNumber}`;
      
      toastHandler(ToastType.Warn, fallbackMessage);
      
      // Copiar número al portapapeles como ayuda adicional
      try {
        await navigator.clipboard.writeText(STORE_WHATSAPP);
        toastHandler(ToastType.Info, `📋 Número de WhatsApp copiado: ${STORE_WHATSAPP}`);
      } catch (error) {
        console.log('No se pudo copiar al portapapeles:', error);
      }
    }
    
    return orderNumber;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toastHandler(ToastType.Error, 'Por favor selecciona una dirección de entrega');
      return;
    }

    setIsProcessing(true);

    try {
      // Animación de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderNumber = await sendToWhatsApp({
        orderNumber: generateOrderNumber(),
        customer: { firstName, lastName, email },
        address: selectedAddress,
        products: cartFromContext,
        pricing: {
          subtotal: totalAmountFromContext,
          deliveryCost,
          coupon: activeCoupon,
          total: finalPriceToPay
        }
      });

      await clearCartDispatch();
      updateCheckoutStatus({ showSuccessMsg: true });

      Popper();
      toastHandler(ToastType.Success, `🎉 Pedido #${orderNumber} procesado exitosamente`);

      timer.current = setTimeout(() => {
        updateCheckoutStatus({ showSuccessMsg: false });
        navigate('/');
      }, 4000);

    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      toastHandler(ToastType.Error, 'Error al procesar el pedido');
    } finally {
      setIsProcessing(false);
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

      <hr />

      <div className={styles.priceBreakdown}>
        <div className={styles.row}>
          <span>
            🛍️ Precio ({totalCountFromContext} artículo{totalCountFromContext > 1 && 's'})
          </span>
          <Price amount={totalAmountFromContext} />
        </div>

        {activeCoupon && (
          <div className={styles.row}>
            <div className={styles.couponApplied}>
              <VscChromeClose
                type='button'
                className={styles.closeBtn}
                onClick={cancelCoupon}
              />{' '}
              <p className={styles.couponText}>
                🎫 Cupón {activeCoupon.couponCode} aplicado ({activeCoupon.discountPercent}%)
              </p>
            </div>
            <Price amount={priceAfterCouponApplied} />
          </div>
        )}

        <div className={styles.row}>
          <span>
            {selectedAddress?.serviceType === SERVICE_TYPES.HOME_DELIVERY 
              ? '🚚 Entrega a domicilio' 
              : '📦 Gastos de Envío'
            }
          </span>
          <Price amount={deliveryCost} />
        </div>
      </div>

      <hr />

      <div className={`${styles.row} ${styles.totalPrice}`}>
        <span>💰 Precio Total</span>
        <Price amount={finalPriceToPay} />
      </div>

      <button 
        onClick={handlePlaceOrder} 
        className={`btn btn-width-100 ${styles.orderBtn} ${isProcessing ? styles.processing : ''}`}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className={styles.processingContent}>
            <span className={styles.spinner}></span>
            Procesando pedido...
          </div>
        ) : (
          <>
            <span className={styles.whatsappIcon}>📱</span>
            Realizar Pedido por WhatsApp
          </>
        )}
      </button>
    </article>
  );
};

export default CheckoutDetails;