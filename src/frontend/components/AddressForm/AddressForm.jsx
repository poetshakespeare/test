import { SERVICE_TYPES, ToastType, COUNTRY_CODES } from '../../constants/constants';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import FormRow from '../FormRow';
import Price from '../Price';
import styles from './AddressForm.module.css';
import {
  toastHandler,
} from '../../utils/utils';

const AddressForm = ({ isAdding, isEditingAndData = null, closeForm }) => {
  const { addAddressDispatch, timedMainPageLoader, editAddressDispatch, cart } =
    useAllProductsContext();

  const { storeConfig } = useConfigContext();
  const SANTIAGO_ZONES = storeConfig.zones || [];

  const isEditing = !!isEditingAndData;

  // FUNCIÓN MEJORADA PARA VERIFICAR ENVÍO DISPONIBLE CON SINCRONIZACIÓN EN TIEMPO REAL
  const hasShippingAvailableInCart = useCallback(() => {
    // 1. Obtener productos actualizados desde localStorage (configuración del admin)
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

    // 2. Verificar cada producto en el carrito
    return cart.some(cartItem => {
      // Extraer el ID del producto (sin el color)
      const productId = cartItem._id.split('#')[0] || cartItem._id;
      
      // Buscar el producto en la configuración del admin (datos más actualizados)
      const adminProduct = adminProducts.find(p => p._id === productId);
      
      // Si encontramos el producto en la configuración del admin, usar esos datos
      if (adminProduct) {
        console.log(`🔍 Producto ${adminProduct.name}: envío disponible = ${adminProduct.isShippingAvailable}`);
        return adminProduct.isShippingAvailable === true;
      }
      
      // Si no está en la configuración del admin, usar los datos del carrito
      console.log(`⚠️ Producto ${cartItem.name}: usando datos del carrito = ${cartItem.isShippingAvailable}`);
      return cartItem.isShippingAvailable === true;
    });
  }, [cart]);

  // ESTADO REACTIVO PARA DETECTAR CAMBIOS EN TIEMPO REAL
  const [canUseHomeDelivery, setCanUseHomeDelivery] = useState(false);

  // EFECTO PARA ACTUALIZAR EL ESTADO CUANDO CAMBIE EL CARRITO O LA CONFIGURACIÓN
  useEffect(() => {
    const updateShippingAvailability = () => {
      const hasShipping = hasShippingAvailableInCart();
      console.log(`🚚 Actualización de envío disponible: ${hasShipping}`);
      setCanUseHomeDelivery(hasShipping);
    };

    // Actualizar inmediatamente
    updateShippingAvailability();

    // Escuchar eventos de actualización de productos
    const handleProductsUpdate = () => {
      console.log('📡 Evento de actualización de productos detectado en AddressForm');
      setTimeout(updateShippingAvailability, 100); // Pequeño delay para asegurar que los datos estén actualizados
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración detectado en AddressForm');
      setTimeout(updateShippingAvailability, 100);
    };

    // Agregar listeners para eventos de sincronización
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('forceStoreUpdate', handleConfigUpdate);
      window.removeEventListener('adminConfigChanged', handleConfigUpdate);
    };
  }, [cart, hasShippingAvailableInCart]); // Dependencia del carrito para reaccionar a cambios

  const defaultState = {
    username: '',
    mobile: '',
    countryCode: '+53', // Cuba por defecto
    serviceType: canUseHomeDelivery ? SERVICE_TYPES.HOME_DELIVERY : SERVICE_TYPES.PICKUP,
    zone: '',
    addressInfo: '',
    receiverName: '',
    receiverPhone: '',
    receiverCountryCode: '+53', // Cuba por defecto
    additionalInfo: '',
  };

  const [inputs, setInputs] = useState(
    isEditing ? {
      ...isEditingAndData,
      countryCode: isEditingAndData.countryCode || '+53',
      receiverCountryCode: isEditingAndData.receiverCountryCode || '+53'
    } : defaultState
  );

  // ACTUALIZAR EL TIPO DE SERVICIO CUANDO CAMBIE LA DISPONIBILIDAD DE ENVÍO
  useEffect(() => {
    if (!isEditing && !canUseHomeDelivery && inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY) {
      setInputs(prev => ({
        ...prev,
        serviceType: SERVICE_TYPES.PICKUP
      }));
    }
  }, [canUseHomeDelivery, isEditing, inputs.serviceType]);

  const [mobileValidation, setMobileValidation] = useState({
    isValid: true,
    message: ''
  });

  const [receiverPhoneValidation, setReceiverPhoneValidation] = useState({
    isValid: true,
    message: ''
  });

  // Función para validar número móvil
  const validateMobileNumber = (countryCode, number) => {
    const country = COUNTRY_CODES.find(c => c.code === countryCode);
    if (!country) return { isValid: false, message: 'Código de país no válido' };

    const cleanNumber = number.replace(/\D/g, '');
    
    if (cleanNumber.length < country.minLength) {
      return { 
        isValid: false, 
        message: `Número muy corto. Mínimo ${country.minLength} dígitos para ${country.country}` 
      };
    }
    
    if (cleanNumber.length > country.maxLength) {
      return { 
        isValid: false, 
        message: `Número muy largo. Máximo ${country.maxLength} dígitos para ${country.country}` 
      };
    }

    return { isValid: true, message: '' };
  };

  const handleInputChange = (e) => {
    const targetEle = e.target;
    const targetEleName = targetEle.name;
    let elementValue = targetEle.value;

    if (targetEle.type === 'number') {
      elementValue = isNaN(targetEle.valueAsNumber)
        ? ''
        : targetEle.valueAsNumber;
    }

    setInputs({
      ...inputs,
      [targetEleName]: elementValue,
    });

    // Validar números móviles en tiempo real
    if (targetEleName === 'mobile' || targetEleName === 'countryCode') {
      const validation = validateMobileNumber(
        targetEleName === 'countryCode' ? elementValue : inputs.countryCode,
        targetEleName === 'mobile' ? elementValue : inputs.mobile
      );
      setMobileValidation(validation);
    }

    if (targetEleName === 'receiverPhone' || targetEleName === 'receiverCountryCode') {
      const validation = validateMobileNumber(
        targetEleName === 'receiverCountryCode' ? elementValue : inputs.receiverCountryCode,
        targetEleName === 'receiverPhone' ? elementValue : inputs.receiverPhone
      );
      setReceiverPhoneValidation(validation);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validaciones según el tipo de servicio
    let requiredFields = ['username', 'mobile', 'serviceType'];
    
    if (inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY) {
      requiredFields = [...requiredFields, 'zone', 'addressInfo', 'receiverName', 'receiverPhone'];
    }

    // Validar campos requeridos
    for (const field of requiredFields) {
      if (!inputs[field] || (typeof inputs[field] === 'string' && !inputs[field].trim())) {
        toastHandler(ToastType.Error, 'Por favor completa todos los campos obligatorios');
        return;
      }
    }

    // Validar números móviles
    if (!mobileValidation.isValid) {
      toastHandler(ToastType.Error, `Número móvil inválido: ${mobileValidation.message}`);
      return;
    }

    if (inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY && !receiverPhoneValidation.isValid) {
      toastHandler(ToastType.Error, `Teléfono del receptor inválido: ${receiverPhoneValidation.message}`);
      return;
    }

    await timedMainPageLoader();

    const addressData = {
      ...inputs,
      addressId: isEditing ? isEditingAndData.addressId : uuid(),
      mobile: `${inputs.countryCode} ${inputs.mobile}`,
      receiverPhone: inputs.receiverPhone ? `${inputs.receiverCountryCode} ${inputs.receiverPhone}` : '',
      deliveryCost: inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY 
        ? SANTIAGO_ZONES.find(zone => zone.id === inputs.zone)?.cost || 0
        : 0
    };

    if (isAdding) {
      addAddressDispatch(addressData);
    }

    if (isEditing) {
      editAddressDispatch(addressData);
    }

    closeForm();
  };

  const handleReset = () => {
    setInputs(defaultState);
    setMobileValidation({ isValid: true, message: '' });
    setReceiverPhoneValidation({ isValid: true, message: '' });
  };

  const isHomeDelivery = inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY;
  const selectedCountry = COUNTRY_CODES.find(c => c.code === inputs.countryCode);
  const selectedReceiverCountry = COUNTRY_CODES.find(c => c.code === inputs.receiverCountryCode);

  return (
    <div className={styles.formOverlay}>
      <form
        onClick={(e) => e.stopPropagation()}
        className={styles.form}
        onSubmit={handleSubmitForm}
      >
        <div className={styles.formHeader}>
          <h3>{isEditing ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
          <button type="button" className={styles.closeBtn} onClick={closeForm}>
            ✕
          </button>
        </div>

        <div className={styles.formContent}>
          <FormRow
            text='Nombre Completo'
            type='text'
            name='username'
            id='username'
            placeholder='Tu nombre completo'
            value={inputs.username}
            handleChange={handleInputChange}
          />

          <div className={styles.formGroup}>
            <label htmlFor='mobile'>📱 Número de Móvil *</label>
            <div className={styles.phoneContainer}>
              <select
                name='countryCode'
                value={inputs.countryCode}
                onChange={handleInputChange}
                className={styles.countrySelect}
                required
              >
                {COUNTRY_CODES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code} {country.country}
                  </option>
                ))}
              </select>
              <input
                type='tel'
                name='mobile'
                id='mobile'
                placeholder='Número móvil'
                value={inputs.mobile}
                onChange={handleInputChange}
                className={`form-input ${!mobileValidation.isValid ? styles.invalidInput : ''}`}
                required
              />
            </div>
            {selectedCountry && (
              <div className={styles.countryInfo}>
                <span className={styles.flag}>{selectedCountry.flag}</span>
                <span>{selectedCountry.country} - {selectedCountry.minLength}-{selectedCountry.maxLength} dígitos</span>
              </div>
            )}
            {!mobileValidation.isValid && (
              <div className={styles.errorMessage}>{mobileValidation.message}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor='serviceType'>🚚 Tipo de Servicio *</label>
            <div className={styles.serviceTypeContainer}>
              <div className={styles.serviceOption}>
                <input
                  type="radio"
                  id="homeDelivery"
                  name="serviceType"
                  value={SERVICE_TYPES.HOME_DELIVERY}
                  checked={inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY}
                  onChange={handleInputChange}
                  disabled={!canUseHomeDelivery}
                />
                <label htmlFor="homeDelivery" className={!canUseHomeDelivery ? styles.disabledOption : ''}>
                  🚚 Entrega a domicilio
                  {!canUseHomeDelivery && (
                    <span className={styles.lockIcon}>🔒</span>
                  )}
                </label>
              </div>
              <div className={styles.serviceOption}>
                <input
                  type="radio"
                  id="pickup"
                  name="serviceType"
                  value={SERVICE_TYPES.PICKUP}
                  checked={inputs.serviceType === SERVICE_TYPES.PICKUP}
                  onChange={handleInputChange}
                />
                <label htmlFor="pickup">
                  🏪 Pedido para recoger en el local
                </label>
              </div>
            </div>
            {!canUseHomeDelivery && (
              <div className={styles.shippingWarning}>
                <span>⚠️ Los productos en tu carrito no tienen envío disponible. Solo puedes recoger en el local.</span>
                <small>💡 Los cambios del panel de administración se aplican en tiempo real</small>
              </div>
            )}
          </div>

          {isHomeDelivery ? (
            <div className={styles.deliverySection}>
              <div className={styles.formGroup}>
                <label htmlFor='zone'>📍 ¿Dónde la entregamos? - Selecciona la zona de tu dirección *</label>
                <select
                  className='form-select'
                  name='zone'
                  id='zone'
                  onChange={handleInputChange}
                  value={inputs.zone}
                  required
                >
                  <option value='' disabled>
                    Selecciona tu zona en Santiago de Cuba:
                  </option>
                  {SANTIAGO_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - <Price amount={zone.cost} />
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor='addressInfo'>🏠 Dirección Completa *</label>
                <textarea
                  name='addressInfo'
                  id='addressInfo'
                  className='form-textarea'
                  placeholder='Dirección completa (calle, número, entre calles, referencias, etc.)'
                  value={inputs.addressInfo}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <FormRow
                text='👤 ¿Quién recibe el pedido? *'
                type='text'
                name='receiverName'
                id='receiverName'
                placeholder='Nombre de quien recibe'
                value={inputs.receiverName}
                handleChange={handleInputChange}
              />

              <div className={styles.formGroup}>
                <label htmlFor='receiverPhone'>📞 Teléfono de quien recibe *</label>
                <div className={styles.phoneContainer}>
                  <select
                    name='receiverCountryCode'
                    value={inputs.receiverCountryCode}
                    onChange={handleInputChange}
                    className={styles.countrySelect}
                    required
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code} {country.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='receiverPhone'
                    id='receiverPhone'
                    placeholder='Teléfono del receptor'
                    value={inputs.receiverPhone}
                    onChange={handleInputChange}
                    className={`form-input ${!receiverPhoneValidation.isValid ? styles.invalidInput : ''}`}
                    required
                  />
                </div>
                {selectedReceiverCountry && (
                  <div className={styles.countryInfo}>
                    <span className={styles.flag}>{selectedReceiverCountry.flag}</span>
                    <span>{selectedReceiverCountry.country} - {selectedReceiverCountry.minLength}-{selectedReceiverCountry.maxLength} dígitos</span>
                  </div>
                )}
                {!receiverPhoneValidation.isValid && (
                  <div className={styles.errorMessage}>{receiverPhoneValidation.message}</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label htmlFor='additionalInfo'>💬 ¿Quieres aclararnos algo?</label>
              <textarea
                name='additionalInfo'
                id='additionalInfo'
                className='form-textarea'
                placeholder='Información adicional sobre tu pedido (opcional)'
                value={inputs.additionalInfo}
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>

        <div className={styles.formBtnContainer}>
          <button 
            type='submit' 
            className={`btn btn-primary ${styles.primaryButton}`}
            disabled={!mobileValidation.isValid || (isHomeDelivery && !receiverPhoneValidation.isValid)}
          >
            {isEditing ? '✅ Actualizar' : '➕ Agregar'}
          </button>

          <div className={styles.secondaryButtons}>
            <button onClick={handleReset} type='button' className='btn btn-hipster'>
              🔄 Restablecer
            </button>

            <button type='button' className='btn btn-danger' onClick={closeForm}>
              ❌ Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;