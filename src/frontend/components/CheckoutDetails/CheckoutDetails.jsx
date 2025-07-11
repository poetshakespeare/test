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

  // FUNCIÓN UNIVERSAL PARA DETECTAR DISPOSITIVOS Y SISTEMAS OPERATIVOS
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const platform = navigator.platform || '';
    
    // Detectar iOS (iPhone, iPad, iPod, Safari en iOS)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Detectar macOS (Safari, Chrome, Firefox en Mac)
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    
    // Detectar Android (Chrome, Firefox, Samsung Internet, etc.)
    const isAndroid = /Android/.test(userAgent);
    
    // Detectar Windows (Chrome, Edge, Firefox en Windows)
    const isWindows = /Windows/.test(userAgent);
    
    // Detectar Linux (Chrome, Firefox en Linux)
    const isLinux = /Linux/.test(userAgent) && !isAndroid;
    
    // Detectar si es móvil/tablet en general
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
    const isTablet = /iPad/.test(userAgent) || 
      (isAndroid && !/Mobile/.test(userAgent)) ||
      (window.innerWidth >= 768 && window.innerWidth <= 1024);
    
    // Detectar navegador específico
    let browser = 'unknown';
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
      browser = 'chrome';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      browser = 'safari';
    } else if (/Firefox/.test(userAgent)) {
      browser = 'firefox';
    } else if (/Edge/.test(userAgent)) {
      browser = 'edge';
    } else if (/Opera/.test(userAgent)) {
      browser = 'opera';
    }
    
    // Detectar capacidades del dispositivo
    const hasWhatsApp = isMobile || isTablet;
    const canOpenApps = isMobile || isTablet;
    
    return {
      isIOS,
      isMacOS,
      isAndroid,
      isWindows,
      isLinux,
      isMobile,
      isTablet,
      hasWhatsApp,
      canOpenApps,
      browser,
      isAppleDevice: isIOS || isMacOS,
      isDesktop: !isMobile && !isTablet
    };
  };

  // FUNCIÓN UNIVERSAL PARA GENERAR URLS DE WHATSAPP PARA TODOS LOS DISPOSITIVOS Y NAVEGADORES
  const generateWhatsAppURL = (message, phoneNumber) => {
    const device = detectDevice();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    console.log('🔍 Dispositivo detectado:', {
      sistema: device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : device.isMacOS ? 'macOS' : device.isWindows ? 'Windows' : device.isLinux ? 'Linux' : 'Desconocido',
      navegador: device.browser,
      tipo: device.isMobile ? 'Móvil' : device.isTablet ? 'Tablet' : 'Escritorio'
    });
    
    // URLs universales que funcionan en todos los dispositivos y navegadores
    const universalUrls = [
      // URL principal de WhatsApp Web/App (funciona en todos los dispositivos)
      `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
      
      // URL de la API oficial de WhatsApp (respaldo)
      `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
      
      // URL scheme para aplicaciones nativas (móviles y tablets)
      `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
      
      // WhatsApp Web específico para escritorio
      `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    ];
    
    // Ordenar URLs según el dispositivo para optimizar la experiencia
    if (device.isIOS) {
      // iOS: Priorizar app nativa, luego web
      return [
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
    }
    
    if (device.isAndroid) {
      // Android: Priorizar app nativa, luego web
      return [
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
    }
    
    if (device.isMacOS) {
      // macOS: Priorizar WhatsApp Web, luego app si está instalada
      return [
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
    }
    
    if (device.isWindows || device.isLinux) {
      // Windows/Linux: Priorizar WhatsApp Web y aplicación de escritorio
      return [
        `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
      ];
    }
    
    // Dispositivos desconocidos: usar URLs universales
    return [
      `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
      `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
      `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
      `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    ];
  };

  // FUNCIÓN UNIVERSAL PARA ABRIR WHATSAPP EN CUALQUIER DISPOSITIVO Y NAVEGADOR
  const tryOpenWhatsApp = async (urls, orderNumber) => {
    const device = detectDevice();
    let success = false;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`🔄 Intentando método ${i + 1}/${urls.length} en ${device.browser}:`, url.substring(0, 50) + '...');
      
      try {
        // Método 1: URL scheme para apps nativas (móviles y tablets)
        if ((device.isMobile || device.isTablet) && url.startsWith('whatsapp://')) {
          // Crear iframe invisible para iOS y algunos Android
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.style.width = '1px';
          iframe.style.height = '1px';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          // Limpiar iframe después de intentar abrir
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
          
          // También intentar con window.location como respaldo
          setTimeout(() => {
            if (!success) {
              window.location.href = url;
            }
          }, 500);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          console.log('✅ Método URL scheme intentado');
          return true;
        }
        
        // Método 2: Abrir en nueva ventana/pestaña (funciona en todos los navegadores)
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          console.log('✅ Nueva ventana/pestaña abierta exitosamente');
          success = true;
          
          // Para móviles y tablets, cerrar la ventana después de un tiempo
          if (device.isMobile || device.isTablet) {
            setTimeout(() => {
              try {
                if (newWindow && !newWindow.closed) {
                  newWindow.close();
                }
              } catch (e) {
                // Ignorar errores de cierre de ventana
              }
            }, 2000);
          }
          
          return true;
        }
        
        // Método 3: Redirección directa (último recurso)
        if (i === urls.length - 1) {
          console.log('🔄 Último intento: redirección directa');
          window.location.href = url;
          return true;
        }
        
      } catch (error) {
        console.log(`❌ Error en método ${i + 1}:`, error.message);
        
        // Si es el último intento y falló, intentar redirección directa
        if (i === urls.length - 1) {
          try {
            console.log('🔄 Último recurso: redirección directa');
            window.location.href = urls[0]; // Usar la primera URL como respaldo
            return true;
          } catch (finalError) {
            console.log('❌ Error en último recurso:', finalError.message);
          }
        }
      }
      
      // Pausa entre intentos para evitar bloqueos del navegador
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Si todos los métodos fallaron, mostrar instrucciones manuales
    return false;
  };

  // FUNCIÓN PARA MOSTRAR INSTRUCCIONES MANUALES SEGÚN EL DISPOSITIVO
  const showManualInstructions = (device, phoneNumber, orderNumber) => {
    let instructions = '';
    
    if (device.isMobile || device.isTablet) {
      if (device.isIOS) {
        instructions = `📱 Para iOS: Abre WhatsApp manualmente y busca el contacto ${phoneNumber}, luego envía el número de pedido #${orderNumber}`;
      } else if (device.isAndroid) {
        instructions = `🤖 Para Android: Abre WhatsApp y contacta a ${phoneNumber} con el pedido #${orderNumber}`;
      } else {
        instructions = `📱 Abre WhatsApp en tu dispositivo y contacta a ${phoneNumber} con el pedido #${orderNumber}`;
      }
    } else {
      if (device.isMacOS) {
        instructions = `💻 Para Mac: Abre WhatsApp Web en Safari/Chrome o la app de WhatsApp si la tienes instalada. Contacta a ${phoneNumber}`;
      } else if (device.isWindows) {
        instructions = `🖥️ Para Windows: Abre WhatsApp Web en tu navegador o la aplicación de WhatsApp. Contacta a ${phoneNumber}`;
      } else if (device.isLinux) {
        instructions = `🐧 Para Linux: Abre WhatsApp Web en tu navegador. Contacta a ${phoneNumber}`;
      } else {
        instructions = `💻 Abre WhatsApp Web en tu navegador y contacta a ${phoneNumber} con el pedido #${orderNumber}`;
      }
    }
    
    return instructions;
  };
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
    
    console.log('🚀 Iniciando envío a WhatsApp universal...');
    console.log('📱 Dispositivo:', {
      sistema: device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : device.isMacOS ? 'macOS' : device.isWindows ? 'Windows' : device.isLinux ? 'Linux' : 'Desconocido',
      navegador: device.browser,
      tipo: device.isMobile ? 'Móvil' : device.isTablet ? 'Tablet' : 'Escritorio'
    });
    
    let message = `🛒 *NUEVO PEDIDO #${orderNumber}*\n\n`;
    message += `---------------------------------------------------------------\n`;
    message += `👤 *INFORMACIÓN DEL CLIENTE*\n`;
    message += `---------------------------------------------------------------\n`;
    message += `📝 *Nombre Completo:* ${firstName} ${lastName}\n`;
    message += `📧 *Correo Electrónico:* ${email}\n`;
    message += `💱 *Moneda seleccionada:* ${currency.flag} ${currency.name} (${currency.code})\n\n`;
    
    // Información del servicio con mejor formato
    message += `🚚 *DETALLES DE ENTREGA*\n`;
    message += `---------------------------------------------------------------\n`;
    
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
    message += `──────────────────────────────────────────────────────────────\n`;
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
    message += `──────────────────────────────────────────────────────────────\n`;
    message += `🛍️ *Subtotal productos:* ${formatPriceWithCode(totalAmountFromContext)}\n`;
    
    if (activeCoupon) {
      message += `🎫 *Descuento aplicado (${activeCoupon.couponCode} - ${activeCoupon.discountPercent}%):* -${formatPriceWithCode(Math.abs(priceAfterCouponApplied))}\n`;
    }
    
    if (deliveryCost > 0) {
      message += `🚚 *Costo de entrega:* ${formatPriceWithCode(deliveryCost)}\n`;
    }
    
    message += `───────────────────────────────────────────────────────────────\n`;
    message += `💰 *TOTAL A PAGAR: ${formatPriceWithCode(finalPriceToPay)}*\n`;
    message += `💱 *Moneda: ${currency.flag} ${currency.name} (${currency.code})*\n`;
    message += `───────────────────────────────────────────────────────────────\n\n`;
    
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
    
    // Mostrar notificación universal
    const deviceType = device.isMobile ? 'móvil' : device.isTablet ? 'tablet' : 'escritorio';
    const systemName = device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : device.isMacOS ? 'macOS' : device.isWindows ? 'Windows' : device.isLinux ? 'Linux' : 'tu dispositivo';
    
    toastHandler(ToastType.Info, `📱 Abriendo WhatsApp en ${systemName} (${deviceType})...`);
    
    // Intentar abrir WhatsApp con múltiples métodos universales
    const success = await tryOpenWhatsApp(whatsappUrls, orderNumber);
    
    if (success) {
      console.log('✅ WhatsApp abierto exitosamente en', systemName);
      toastHandler(ToastType.Success, `✅ Pedido #${orderNumber} enviado a WhatsApp`);
    } else {
      console.log('❌ No se pudo abrir WhatsApp automáticamente en', systemName);
      
      // Mostrar instrucciones específicas según el dispositivo
      const instructions = showManualInstructions(device, STORE_WHATSAPP, orderNumber);
      toastHandler(ToastType.Warn, instructions);
      
      // Copiar número al portapapeles como ayuda adicional
      try {
        await navigator.clipboard.writeText(STORE_WHATSAPP);
        toastHandler(ToastType.Info, `📋 Número de WhatsApp copiado: ${STORE_WHATSAPP}`);
      } catch (error) {
        console.log('No se pudo copiar al portapapeles:', error);
        // Mostrar el número en una notificación adicional
        toastHandler(ToastType.Info, `📞 Número de WhatsApp: ${STORE_WHATSAPP}`);
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