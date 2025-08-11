import React, { useEffect, useState } from 'react';
import {
  ToastType,
  DELAY_BETWEEN_BLUR_AND_CLICK,
} from '../../constants/constants';

import styles from './CheckoutDetails.module.css';

import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import { AiFillTag } from 'react-icons/ai';
import Price from '../Price';
import { toastHandler, wait } from '../../utils/utils';
import { useIsMobile } from '../../hooks';

const CouponSearch = ({ activeCoupon, updateActiveCoupon }) => {
  const [isCouponsSuggestionVisible, setIsCouponsSuggestionVisible] =
    useState(false);
  const [couponSearchInput, setCouponSearchInput] = useState('');
  const {
    cartDetails: { totalAmount: totalAmountFromContext },
    cart: cartFromContext,
  } = useAllProductsContext();

  const { storeConfig } = useConfigContext();
  const { formatPriceWithCode, getCurrentCurrency } = useCurrencyContext();
  const COUPONS = storeConfig.coupons || [];

  const isMobile = useIsMobile();

  // VERIFICAR SI TODOS LOS PRODUCTOS EN EL CARRITO PUEDEN USAR CUPONES
  const canUseAnyCoupons = () => {
    // Si el carrito está vacío, no se pueden usar cupones
    if (cartFromContext.length === 0) {
      return false;
    }

    // Obtener productos actualizados desde localStorage (configuración del admin)
    const savedConfig = localStorage.getItem('adminStoreConfig');
    let adminProducts = [];
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        adminProducts = parsedConfig.products || [];
      } catch (error) {
        console.error('Error al cargar productos del admin:', error);
      }
    }

    // Verificar cada producto en el carrito
    const allProductsCanUseCoupons = cartFromContext.every(cartItem => {
      // Extraer el ID del producto (sin el color)
      const productId = cartItem._id.split('#')[0] || cartItem._id;
      
      // Buscar el producto en la configuración del admin (datos más actualizados)
      const adminProduct = adminProducts.find(p => p._id === productId);
      
      // Si encontramos el producto en la configuración del admin, usar esos datos
      if (adminProduct) {
        console.log(`🔍 Producto ${adminProduct.name}: puede usar cupones = ${adminProduct.canUseCoupons !== false}`);
        return adminProduct.canUseCoupons !== false; // Por defecto true si no está definido
      }
      
      // Si no está en la configuración del admin, usar los datos del carrito
      console.log(`⚠️ Producto ${cartItem.name}: usando datos del carrito = ${cartItem.canUseCoupons !== false}`);
      return cartItem.canUseCoupons !== false; // Por defecto true si no está definido
    });

    console.log(`🎫 ¿Todos los productos pueden usar cupones? ${allProductsCanUseCoupons}`);
    return allProductsCanUseCoupons;
  };

  const couponsEnabled = canUseAnyCoupons();

  const handleSearchFocus = () => {
    if (!couponsEnabled) {
      toastHandler(
        ToastType.Warn,
        'Los cupones no están disponibles para algunos productos en tu carrito'
      );
      return;
    }
    setIsCouponsSuggestionVisible(true);
  };

  const handleSearchBlur = async () => {
    await wait(DELAY_BETWEEN_BLUR_AND_CLICK);
    setIsCouponsSuggestionVisible(false);
  };

  const handleCouponClick = (couponClicked) => {
    if (!couponsEnabled) {
      toastHandler(
        ToastType.Warn,
        'Los cupones no están disponibles para algunos productos en tu carrito'
      );
      return;
    }

    //  for mobile, there is no tooltip and buttons not disabled for the following condition
    if (
      isMobile &&
      totalAmountFromContext < couponClicked.minCartPriceRequired
    ) {
      toastHandler(
        ToastType.Info,
        `Compra por encima de ${formatPriceWithCode(
          couponClicked.minCartPriceRequired
        )} para aplicar`
      );
      return;
    }

    setCouponSearchInput(couponClicked.couponCode);

    // if activeCoupon and the couponClicked in suggestion is same do nothing
    if (activeCoupon?.couponCode === couponClicked.couponCode) {
      return;
    }

    updateActiveCoupon(couponClicked);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (!couponsEnabled) {
      toastHandler(
        ToastType.Warn,
        'Los cupones no están disponibles para algunos productos en tu carrito'
      );
      return;
    }

    setIsCouponsSuggestionVisible(false);

    if (!couponSearchInput) {
      setIsCouponsSuggestionVisible(true);
      return;
    }

    const couponFound = COUPONS.find(
      ({ couponCode }) =>
        couponCode.toUpperCase() === couponSearchInput.toUpperCase()
    );

    //  user input based coupon not found, so all coupons suggestion visible
    if (!couponFound) {
      toastHandler(
        ToastType.Error,
        `Cupón ${couponSearchInput} No Disponible`
      );

      setIsCouponsSuggestionVisible(true);

      return;
    }

    const isCouponAvailable =
      couponFound.minCartPriceRequired <= totalAmountFromContext;

    if (couponFound && !isCouponAvailable) {
      const currency = getCurrentCurrency();
      toastHandler(
        ToastType.Error, 
        `Compra por encima de ${formatPriceWithCode(couponFound.minCartPriceRequired)} para usar este cupón`
      );
      return;
    }

    // if couponSearchInput and activeCouponCode is same, do nothing
    if (activeCoupon?.id === couponFound.id) {
      return;
    }

    // else update and show toast
    updateActiveCoupon(couponFound);
  };

  useEffect(() => {
    if (!activeCoupon) {
      setCouponSearchInput('');
    }
  }, [activeCoupon]);

  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN MEJORADOS CON VERIFICACIÓN
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      const { products: updatedProducts } = event.detail;
      console.log('📡 Evento de actualización de productos detectado en CouponSearch');
      setTimeout(updateShippingAvailability, 100);
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración detectado en CouponSearch');
      setTimeout(updateShippingAvailability, 100);
    };

    const handleAdminPanelSync = (event) => {
      const { type } = event.detail;
      if (type === 'products' || type === 'coupons' || type === 'couponproducts') {
        console.log('📡 Sincronización de panel admin detectada en CouponSearch');
        // Forzar re-evaluación de cupones disponibles
        setTimeout(() => {
          window.location.reload(); // Recargar para aplicar cambios de cupones
        }, 500);
      }
    };

    // Agregar listeners para eventos de sincronización
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);
    window.addEventListener('adminPanelSync', handleAdminPanelSync);

    // Cleanup
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('forceStoreUpdate', handleConfigUpdate);
      window.removeEventListener('adminConfigChanged', handleConfigUpdate);
      window.removeEventListener('adminPanelSync', handleAdminPanelSync);
    };
  }, [cartFromContext]); // Dependencia del carrito para reaccionar a cambios

  return (
    <form onSubmit={handleSearchSubmit} className={styles.searchCoupons}>
      <AiFillTag />
      <div>
        <input
          className={`form-input ${!couponsEnabled ? styles.disabledInput : ''}`}
          type='search'
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder={couponsEnabled ? 'Ingresa código de cupón' : 'Cupones no disponibles'}
          onChange={(e) => setCouponSearchInput(e.target.value)}
          value={couponSearchInput}
          disabled={!couponsEnabled}
        />
        <button 
          disabled={!couponSearchInput || !couponsEnabled} 
          type='submit' 
          className='btn'
        >
          Aplicar
        </button>
      </div>

      {!couponsEnabled && (
        <div className={styles.couponWarning}>
          <span>⚠️ Algunos productos en tu carrito no pueden usar cupones de descuento</span>
          <small>💡 Los cupones solo se aplican si TODOS los productos del carrito los permiten</small>
        </div>
      )}

      {isCouponsSuggestionVisible && couponsEnabled && (
        <div className={styles.couponSuggestion}>
          {COUPONS.map((singleCoupon) => {
            const isButtonDisabled =
              totalAmountFromContext < singleCoupon.minCartPriceRequired;

            return (
              <button
                type='button'
                key={singleCoupon.id}
                onClick={() => handleCouponClick(singleCoupon)}
                className={isButtonDisabled ? styles.btnDisableMobile : ''}
                disabled={!isMobile && isButtonDisabled}
              >
                {singleCoupon.text}

                <div>{singleCoupon.couponCode}</div>

                {!isMobile && (
                  <span className={styles.tooltip}>
                    Compra por encima de{' '}
                    <Price amount={singleCoupon.minCartPriceRequired} /> para
                    aplicar
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
};

export default CouponSearch;