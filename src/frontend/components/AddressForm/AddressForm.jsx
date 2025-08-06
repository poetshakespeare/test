import { SERVICE_TYPES, ToastType, COUNTRY_CODES } from '../../constants/constants';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import FormRow from '../FormRow';
import Price from '../Price';
import DistanceCalculator from '../DistanceCalculator/DistanceCalculator';
import { generateDistanceMessage } from '../../utils/distanceCalculator';
import styles from './AddressForm.module.css';
import {
  toastHandler,
  validateEmail,
  validateMobile
} from '../../utils/utils';

const AddressForm = ({ 
  isEditing = false, 
  isEditingAndData = null, 
  onClose, 
  onAddressAdded 
}) => {
  const { config } = useConfigContext();
  const { allProducts } = useAllProductsContext();

  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    countryCode: '+56',
    mobile: '',
    address: '',
    serviceType: SERVICE_TYPES.PICKUP,
    zone: '',
    receiverName: '',
    receiverCountryCode: '+56',
    receiverPhone: '',
    additionalInfo: ''
  });

  const [mobileValidation, setMobileValidation] = useState({
    isValid: true,
    message: ''
  });

  const [receiverPhoneValidation, setReceiverPhoneValidation] = useState({
    isValid: true,
    message: ''
  });

  const [distanceInfo, setDistanceInfo] = useState(null);

  // Función para validar número móvil
  const validateMobileNumber = (countryCode, number) => {
    if (!number.trim()) {
      return { isValid: false, message: 'El número móvil es requerido' };
    }
    
    const isValid = validateMobile(countryCode, number);
    return {
      isValid,
      message: isValid ? '' : 'Número móvil inválido'
    };
  };

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (isEditing && isEditingAndData) {
      const data = isEditingAndData;
      
      // Separar código de país del número móvil
      const mobileMatch = data.mobile?.match(/^(\+\d+)\s(.+)$/);
      const countryCode = mobileMatch ? mobileMatch[1] : '+56';
      const mobile = mobileMatch ? mobileMatch[2] : data.mobile || '';

      // Separar código de país del teléfono del receptor
      const receiverPhoneMatch = data.receiverPhone?.match(/^(\+\d+)\s(.+)$/);
      const receiverCountryCode = receiverPhoneMatch ? receiverPhoneMatch[1] : '+56';
      const receiverPhone = receiverPhoneMatch ? receiverPhoneMatch[2] : data.receiverPhone || '';

      setInputs({
        name: data.name || '',
        email: data.email || '',
        countryCode,
        mobile,
        address: data.address || '',
        serviceType: data.serviceType || SERVICE_TYPES.PICKUP,
        zone: data.zone || '',
        receiverName: data.receiverName || '',
        receiverCountryCode,
        receiverPhone,
        additionalInfo: data.additionalInfo || ''
      });

      // Validar móvil inicial
      const validation = validateMobileNumber(countryCode, mobile);
      setMobileValidation(validation);

      // Validar teléfono receptor si existe
      if (receiverPhone) {
        const receiverValidation = validateMobileNumber(receiverCountryCode, receiverPhone);
        setReceiverPhoneValidation(receiverValidation);
      }
    }
  }, [isEditing, isEditingAndData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real para móvil
    if (name === 'mobile' || name === 'countryCode') {
      const mobile = name === 'mobile' ? value : inputs.mobile;
      const countryCode = name === 'countryCode' ? value : inputs.countryCode;
      const validation = validateMobileNumber(countryCode, mobile);
      setMobileValidation(validation);
    }

    // Validación en tiempo real para teléfono receptor
    if (name === 'receiverPhone' || name === 'receiverCountryCode') {
      const receiverPhone = name === 'receiverPhone' ? value : inputs.receiverPhone;
      const receiverCountryCode = name === 'receiverCountryCode' ? value : inputs.receiverCountryCode;
      
      if (receiverPhone.trim()) {
        const validation = validateMobileNumber(receiverCountryCode, receiverPhone);
        setReceiverPhoneValidation(validation);
      } else {
        setReceiverPhoneValidation({ isValid: true, message: '' });
      }
    }

    // Limpiar validación del teléfono receptor cuando se cambia el tipo de servicio
    if (name === 'serviceType' && value !== SERVICE_TYPES.HOME_DELIVERY) {
      setReceiverPhoneValidation({ isValid: true, message: '' });
    }
  }, [inputs.mobile, inputs.countryCode, inputs.receiverPhone, inputs.receiverCountryCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones finales
    if (!mobileValidation.isValid) {
      toastHandler('error', 'Por favor corrige el número móvil');
      return;
    }

    if (inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY && !receiverPhoneValidation.isValid) {
      toastHandler('error', 'Por favor corrige el teléfono del receptor');
      return;
    }

    if (!inputs.name.trim()) {
      toastHandler('error', 'El nombre es requerido');
      return;
    }

    if (!inputs.email.trim() || !validateEmail(inputs.email)) {
      toastHandler('error', 'Email inválido');
      return;
    }

    if (!inputs.address.trim()) {
      toastHandler('error', 'La dirección es requerida');
      return;
    }

    if (inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY && !inputs.zone) {
      toastHandler('error', 'Debes seleccionar una zona para delivery');
      return;
    }

    if (inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY && !inputs.receiverName.trim()) {
      toastHandler('error', 'El nombre del receptor es requerido para delivery');
      return;
    }

    const formData = getFormDataWithDistance();
    onAddressAdded(formData);
    onClose();
    
    const message = isEditing ? 'Dirección actualizada exitosamente' : 'Dirección agregada exitosamente';
    toastHandler('success', message);
  };

  const handleCancel = () => {
    onClose();
    setInputs({
      name: '',
      email: '',
      countryCode: '+56',
      mobile: '',
      address: '',
      serviceType: SERVICE_TYPES.PICKUP,
      zone: '',
      receiverName: '',
      receiverCountryCode: '+56',
      receiverPhone: '',
      additionalInfo: ''
    });
    setMobileValidation({ isValid: true, message: '' });
    setReceiverPhoneValidation({ isValid: true, message: '' });
  };

  const handleDistanceCalculated = (tripData) => {
    setDistanceInfo(tripData);
  };

  const isHomeDelivery = inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY;
  const selectedCountry = COUNTRY_CODES.find(c => c.code === inputs.countryCode);
  const selectedReceiverCountry = COUNTRY_CODES.find(c => c.code === inputs.receiverCountryCode);

  // Agregar información de distancia a los datos del formulario
  const getFormDataWithDistance = () => {
    const baseData = {
      ...inputs,
      addressId: isEditing ? isEditingAndData.addressId : uuid(),
      mobile: `${inputs.countryCode} ${inputs.mobile}`,
      receiverPhone: inputs.receiverPhone ? `${inputs.receiverCountryCode} ${inputs.receiverPhone}` : '',
      deliveryCost: inputs.serviceType === SERVICE_TYPES.HOME_DELIVERY 
        ? SANTIAGO_ZONES.find(zone => zone.id === inputs.zone)?.cost || 0
        : 0
    };

    // Si es pickup y tenemos información de distancia, agregarla
    if (inputs.serviceType === SERVICE_TYPES.PICKUP && distanceInfo) {
      baseData.distanceInfo = distanceInfo;
      baseData.distanceMessage = generateDistanceMessage(distanceInfo);
    }

    return baseData;
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2>{isEditing ? '✏️ Editar Dirección' : '📍 Nueva Dirección'}</h2>
          <button 
            type="button" 
            className={styles.closeButton}
            onClick={handleCancel}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>
            <FormRow>
              <div className={styles.formGroup}>
                <label htmlFor='name'>👤 Nombre completo *</label>
                <input
                  type='text'
                  name='name'
                  id='name'
                  className='form-input'
                  placeholder='Tu nombre completo'
                  value={inputs.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor='email'>📧 Email *</label>
                <input
                  type='email'
                  name='email'
                  id='email'
                  className='form-input'
                  placeholder='tu@email.com'
                  value={inputs.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </FormRow>

            <FormRow>
              <div className={styles.formGroup}>
                <label htmlFor='mobile'>📱 Móvil *</label>
                <div className={styles.phoneInputContainer}>
                  <select
                    name='countryCode'
                    value={inputs.countryCode}
                    onChange={handleInputChange}
                    className={styles.countrySelect}
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='mobile'
                    id='mobile'
                    className={`form-input ${!mobileValidation.isValid ? styles.inputError : ''}`}
                    placeholder={selectedCountry?.placeholder || 'Número móvil'}
                    value={inputs.mobile}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {!mobileValidation.isValid && (
                  <span className={styles.errorMessage}>{mobileValidation.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor='address'>🏠 Dirección *</label>
                <input
                  type='text'
                  name='address'
                  id='address'
                  className='form-input'
                  placeholder='Tu dirección completa'
                  value={inputs.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </FormRow>

            <div className={styles.formGroup}>
              <label htmlFor='serviceType'>🚚 Tipo de servicio *</label>
              <select
                name='serviceType'
                id='serviceType'
                className='form-select'
                value={inputs.serviceType}
                onChange={handleInputChange}
                required
              >
                <option value={SERVICE_TYPES.PICKUP}>🏃‍♂️ Retiro en tienda</option>
                <option value={SERVICE_TYPES.HOME_DELIVERY}>🚚 Delivery a domicilio</option>
              </select>
            </div>

            {isHomeDelivery && (
              <div className={styles.deliverySection}>
                <div className={styles.formGroup}>
                  <label htmlFor='zone'>📍 Zona de delivery *</label>
                  <select
                    name='zone'
                    id='zone'
                    className='form-select'
                    value={inputs.zone}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>Selecciona una zona</option>
                    {SANTIAGO_ZONES.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} - <Price amount={zone.cost} />
                      </option>
                    ))}
                  </select>
                </div>

                <FormRow>
                  <div className={styles.formGroup}>
                    <label htmlFor='receiverName'>👤 Nombre del receptor *</label>
                    <input
                      type='text'
                      name='receiverName'
                      id='receiverName'
                      className='form-input'
                      placeholder='Nombre de quien recibe'
                      value={inputs.receiverName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor='receiverPhone'>📱 Teléfono del receptor</label>
                    <div className={styles.phoneInputContainer}>
                      <select
                        name='receiverCountryCode'
                        value={inputs.receiverCountryCode}
                        onChange={handleInputChange}
                        className={styles.countrySelect}
                      >
                        {COUNTRY_CODES.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type='tel'
                        name='receiverPhone'
                        id='receiverPhone'
                        className={`form-input ${!receiverPhoneValidation.isValid ? styles.inputError : ''}`}
                        placeholder={selectedReceiverCountry?.placeholder || 'Teléfono del receptor'}
                        value={inputs.receiverPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                    {!receiverPhoneValidation.isValid && (
                      <span className={styles.errorMessage}>{receiverPhoneValidation.message}</span>
                    )}
                  </div>
                </FormRow>
              </div>
            )}

            {!isHomeDelivery && (
              <div className={styles.pickupSection}>
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

                <DistanceCalculator onDistanceCalculated={handleDistanceCalculated} />
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
            <button 
              type='button' 
              className={`btn btn-secondary ${styles.secondaryButton}`}
              onClick={handleCancel}
            >
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;