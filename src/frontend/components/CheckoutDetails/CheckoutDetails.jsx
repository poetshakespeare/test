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
  const { formatPriceWithCode, getCurrentCurrency } = useCurrencyContext();
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
    const discountAmount = Math.floor((totalAmountFromContext * couponObjClicked.discountPercent) / 100);
    
    toastHandler(
      ToastType.Success, 
      `🎫 Cupón ${couponObjClicked.couponCode} aplicado: ${couponObjClicked.discountPercent}% de descuento (${formatPriceWithCode(discountAmount)})`
    );
  };

  const cancelCoupon = () => {
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
    const platform = navigator.platform || '';
    
    // Detectar iOS (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Detectar macOS
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent) || /Mac/.test(platform);
    
    // Detectar Android
    const isAndroid = /Android/.test(userAgent);
    
    // Detectar Windows
    const isWindows = /Windows/.test(userAgent) || /Win/.test(platform);
    
    // Detectar Linux
    const isLinux = /Linux/.test(userAgent) && !isAndroid;
    
    // Detectar si es móvil en general
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS || 
                    (window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    
    // Detectar si es tablet
    const isTablet = (/iPad/.test(userAgent)) || 
                    (isAndroid && !/Mobile/.test(userAgent)) ||
                    (window.innerWidth >= 768 && window.innerWidth <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    
    // Detectar navegador específico
    let browser = 'unknown';
    if (/Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent)) {
      browser = 'chrome';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      browser = 'safari';
    } else if (/Firefox/.test(userAgent)) {
      browser = 'firefox';
    } else if (/Edge|Edg/.test(userAgent)) {
      browser = 'edge';
    } else if (/Opera|OPR/.test(userAgent)) {
      browser = 'opera';
    }
    
    // Detectar capacidades del dispositivo
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isDesktop = !isMobile && !isTablet;
    
    return {
      isIOS,
      isMacOS,
      isAndroid,
      isWindows,
      isLinux,
      isMobile,
      isTablet,
      isDesktop,
      browser,
      hasTouch,
      isAppleDevice: isIOS || isMacOS,
      userAgent,
      platform
    };
  };

  // FUNCIÓN MEJORADA PARA GENERAR URL DE WHATSAPP COMPATIBLE CON TODOS LOS DISPOSITIVOS
  const generateWhatsAppURL = (message, phoneNumber) => {
    const device = detectDevice();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    console.log('🔍 Dispositivo detectado:', device);
    console.log('📱 Número limpio:', cleanPhone);
    
    // URLs universales que funcionan en todos los dispositivos y navegadores
    const universalUrls = [];
    
    // 1. URL principal wa.me (funciona en todos los dispositivos y navegadores)
    universalUrls.push(`https://wa.me/${cleanPhone}?text=${encodedMessage}`);
    
    // 2. Para dispositivos móviles y tablets: intentar app nativa primero
    if (device.isMobile || device.isTablet) {
      universalUrls.unshift(`whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`);
    }
    
    // 3. Para escritorio: WhatsApp Web como alternativa
    if (device.isDesktop) {
      universalUrls.push(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`);
    }
    
    // 4. API de WhatsApp como fallback universal
    universalUrls.push(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`);
    
    console.log(`📱 URLs universales generadas para ${device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : device.isMacOS ? 'macOS' : device.isWindows ? 'Windows' : device.isLinux ? 'Linux' : 'Desconocido'}:`, universalUrls);
    return universalUrls;
  };

  // FUNCIÓN MEJORADA PARA INTENTAR ABRIR WHATSAPP CON MÚLTIPLES MÉTODOS
  const tryOpenWhatsApp = async (urls, orderNumber, phoneNumber) => {
    const device = detectDevice();
    let success = false;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`🔄 Intentando método ${i + 1}/${urls.length}:`, url);
      
      try {
        // Método 1: Para URLs de esquema (whatsapp://) en móviles y tablets
        if (url.startsWith('whatsapp://') && (device.isMobile || device.isTablet)) {
          // Crear un enlace invisible y hacer clic
          const link = document.createElement('a');
          link.href = url;
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // Detectar si la app se abre
          let appOpened = false;
          const startTime = Date.now();
          
          // Listener para detectar si la página pierde el foco (app se abre)
          const handleVisibilityChange = () => {
            if (document.hidden || Date.now() - startTime > 1000) {
              appOpened = true;
            }
          };
          
          const handleBlur = () => {
            appOpened = true;
          };
          
          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('blur', handleBlur);
          
          // Hacer clic en el enlace
          link.click();
          
          // Esperar un momento para ver si la app se abre
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Limpiar
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleBlur);
          document.body.removeChild(link);
          
          if (appOpened) {
            console.log('✅ App de WhatsApp abierta exitosamente');
            success = true;
            break;
          } else {
            console.log('⚠️ App de WhatsApp no disponible, intentando siguiente método...');
            continue;
          }
        }
        
        // Método 2: Para URLs HTTPS - abrir en nueva ventana/pestaña
        if (url.startsWith('https://')) {
          // Configurar opciones de ventana según el dispositivo
          let windowFeatures = 'noopener,noreferrer';
          
          if (device.isDesktop) {
            // Para escritorio: ventana popup centrada
            const width = 800;
            const height = 600;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            windowFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,${windowFeatures}`;
          }
          
          const newWindow = window.open(url, '_blank', windowFeatures);
          
          if (newWindow) {
            console.log('✅ Ventana de WhatsApp abierta exitosamente');
            
            // Para móviles y tablets: cerrar la ventana después de un tiempo
            if (device.isMobile || device.isTablet) {
              setTimeout(() => {
                try {
                  if (!newWindow.closed) {
                    newWindow.close();
                  }
                } catch (e) {
                  console.log('ℹ️ No se pudo cerrar la ventana automáticamente');
                }
              }, 3000);
            }
            
            success = true;
            break;
          } else {
            console.log('⚠️ Bloqueador de ventanas emergentes activo, intentando método alternativo...');
            
            // Método alternativo: cambiar la ubicación actual
            if (i === urls.length - 1) {
              window.location.href = url;
              success = true;
              break;
            }
            continue;
          }
        }
        
        // Método 3: Fallback - crear enlace y hacer clic
        const fallbackLink = document.createElement('a');
        fallbackLink.href = url;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        fallbackLink.style.display = 'none';
        document.body.appendChild(fallbackLink);
        
        fallbackLink.click();
        
        setTimeout(() => {
          document.body.removeChild(fallbackLink);
        }, 1000);
        
        console.log('✅ Enlace de fallback ejecutado');
        success = true;
        break;
        
      } catch (error) {
        console.log(`❌ Error en método ${i + 1}:`, error);
        
        // Si es el último intento y no hemos tenido éxito, intentar método de emergencia
        if (i === urls.length - 1 && !success) {
          try {
            // Método de emergencia: copiar al portapapeles y mostrar instrucciones
            const emergencyMessage = `WhatsApp: ${phoneNumber}\n\nPor favor contacta manualmente para completar tu pedido.`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(emergencyMessage);
              console.log('📋 Mensaje copiado al portapapeles como método de emergencia');
              success = true;
            }
          } catch (clipboardError) {
            console.log('❌ Error al copiar al portapapeles:', clipboardError);
          }
        }
      }
      
      // Pequeña pausa entre intentos
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return success;
  };

  const sendToWhatsApp = async (orderData) => {
    const orderNumber = generateOrderNumber();
    const currency = getCurrentCurrency();
    const device = detectDevice();
    
    console.log('🚀 Iniciando envío a WhatsApp...');
    console.log('📱 Dispositivo:', device);
    console.log('📞 Número de WhatsApp:', storeConfig.storeInfo?.whatsappNumber || '+53 54690878');
    
    // CATÁLOGO PROFESIONAL CON IMAGEN DE LA TIENDA
    let message = `🏪 *YERO SHOP!* - Tu tienda online de confianza\n`;
    message += `📸 Imagen del catálogo: https://f005.backblazeb2.com/file/120000/Yero+Shop/lovepik.png\n\n`;
    
    // Separador visual profesional
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🛍️ *CATÁLOGO DIGITAL PROFESIONAL* 🛍️\n`;
    message += `═══════════════════════════════════════════════════════════════\n\n`;
    
    // Número de orden con diseño moderno y animado
    message += `✨ ═══════════════════════════════════ ✨\n`;
    message += `🎯 *NUEVO PEDIDO*\n`;
    message += `🔥 *#${orderNumber}* 🔥\n`;
    message += `✨ ═══════════════════════════════════ ✨\n\n`;
    
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `👤 *INFORMACIÓN DEL CLIENTE*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `📝 *Nombre Completo:* ${firstName} ${lastName}\n`;
    message += `📧 *Correo Electrónico:* ${email}\n`;
    message += `💱 *Moneda seleccionada:* ${currency.flag} ${currency.name} (${currency.code})\n\n`;
    
    // Información del servicio con mejor formato
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🚚 *DETALLES DE ENTREGA*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `👤 *Nombre Completo del Cliente:* ${selectedAddress.username}\n`;
    message += `📱 *Número de Móvil del Cliente:* ${selectedAddress.mobile}\n`;
    
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
    
    message += `\n`;
    
    // Productos con iconos y mejor formato
    message += `═══════════════════════════════════════════════════════════════\n`;
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
      message += `   ═══════════════════════════════════════════════════════\n`;
    });
    
    // Resumen financiero profesional
    message += `\n═══════════════════════════════════════════════════════════════\n`;
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
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `📅 *Fecha y hora del pedido:*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `${new Date().toLocaleString('es-CU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Havana'
    })}\n\n`;
    
    // Número de orden destacado al final
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🎯 *NÚMERO DE PEDIDO PARA REFERENCIA:*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🌟 ═══════════════════════════════════ 🌟\n`;
    message += `🔥 *#${orderNumber}* 🔥\n`;
    message += `🌟 ═══════════════════════════════════ 🌟\n\n`;
    
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `📋 *Instrucciones importantes:*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `• Confirme la disponibilidad de los productos\n`;
    message += `• Verifique la dirección de entrega\n`;
    message += `• Coordine horario de entrega/recogida\n`;
    message += `• Mantenga este número de pedido para referencia\n`;
    message += `• Los precios están en ${currency.name} (${currency.code})\n\n`;
    
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🏪 *INFORMACIÓN DE LA TIENDA*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🏪 *Yero Shop!*\n`;
    message += `"La tienda online de compras hecha a tu medida" ✨\n`;
    message += `📍 Santiago de Cuba, Cuba\n`;
    message += `📱 WhatsApp: ${storeConfig.storeInfo?.whatsappNumber || '+53 54690878'}\n`;
    message += `🌐 Tienda online: https://yeroshop.vercel.app\n\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `🙏 *MENSAJE DE AGRADECIMIENTO*\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `¡Gracias por confiar en nosotros! 🙏\n`;
    message += `Su satisfacción es nuestra prioridad 💯\n`;
    message += `═══════════════════════════════════════════════════════════════\n`;
    message += `📸 Ver catálogo completo: https://f005.backblazeb2.com/file/120000/Yero+Shop/lovepik.png\n`;
    message += `═══════════════════════════════════════════════════════════════`;

    // Generar URLs según el dispositivo
    const whatsappUrls = generateWhatsAppURL(message, storeConfig.storeInfo?.whatsappNumber || '+53 54690878');
    
    // Mostrar notificación específica según el dispositivo
    if (device.isIOS) {
      toastHandler(ToastType.Info, `📱 Abriendo WhatsApp en iOS...`);
    } else if (device.isMacOS) {
      toastHandler(ToastType.Info, `💻 Abriendo WhatsApp en macOS...`);
    } else if (device.isAndroid) {
      toastHandler(ToastType.Info, `🤖 Abriendo WhatsApp en Android...`);
    } else if (device.isWindows) {
      toastHandler(ToastType.Info, `🪟 Abriendo WhatsApp en Windows...`);
    } else if (device.isLinux) {
      toastHandler(ToastType.Info, `🐧 Abriendo WhatsApp en Linux...`);
    } else if (device.isTablet) {
      toastHandler(ToastType.Info, `📱 Abriendo WhatsApp en tablet...`);
    } else {
      toastHandler(ToastType.Info, `💻 Abriendo WhatsApp...`);
    }
    
    // Intentar abrir WhatsApp con múltiples métodos
    const success = await tryOpenWhatsApp(whatsappUrls, orderNumber, storeConfig.storeInfo?.whatsappNumber || '+53 54690878');
    
    if (success) {
      console.log('✅ WhatsApp abierto exitosamente');
      toastHandler(ToastType.Success, `✅ Pedido #${orderNumber} enviado a WhatsApp exitosamente`);
    } else {
      console.log('❌ No se pudo abrir WhatsApp automáticamente');
      
      // Fallback: mostrar información manual
      let fallbackMessage = `📱 Por favor, abre WhatsApp manualmente y contacta a ${storeConfig.storeInfo?.whatsappNumber || '+53 54690878'} con el pedido #${orderNumber}`;
      
      if (device.isDesktop) {
        fallbackMessage = `💻 Por favor, abre WhatsApp Web (web.whatsapp.com) o la aplicación de escritorio y contacta a ${storeConfig.storeInfo?.whatsappNumber || '+53 54690878'} con el pedido #${orderNumber}`;
      }
      
      toastHandler(ToastType.Warn, fallbackMessage);
      
      // Copiar número al portapapeles como ayuda adicional
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(storeConfig.storeInfo?.whatsappNumber || '+53 54690878');
          toastHandler(ToastType.Info, `📋 Número de WhatsApp copiado: ${storeConfig.storeInfo?.whatsappNumber || '+53 54690878'}`);
        }
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