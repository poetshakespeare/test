import React, { useState, useEffect } from 'react';
import { validateEmailComplete, generateEmailSuggestions, getEmailProvider } from '../../utils/emailValidation';
import styles from './EmailValidationField.module.css';

const EmailValidationField = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "tu-email@gmail.com, @yahoo.com, @hotmail.com...",
  disabled = false,
  required = true
}) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    isValid: null,
    message: '',
    provider: null,
    exists: null
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Validar email cuando cambie el valor
  useEffect(() => {
    const validateEmail = async () => {
      if (!value || !value.includes('@')) {
        setValidationState({
          isValidating: false,
          isValid: null,
          message: '',
          provider: null,
          exists: null
        });
        
        // Generar sugerencias si no hay @
        if (value && !value.includes('@')) {
          const emailSuggestions = generateEmailSuggestions(value);
          setSuggestions(emailSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        
        if (onValidationChange) {
          onValidationChange({ isValid: false, message: '' });
        }
        return;
      }

      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const validation = await validateEmailComplete(value);
        
        setValidationState({
          isValidating: false,
          isValid: validation.isValid,
          message: validation.message,
          provider: validation.provider,
          exists: validation.exists
        });

        if (onValidationChange) {
          onValidationChange(validation);
        }

        // Ocultar sugerencias cuando hay un email completo
        setShowSuggestions(false);
        setSuggestions([]);

      } catch (error) {
        setValidationState({
          isValidating: false,
          isValid: false,
          message: 'Error al validar el email',
          provider: null,
          exists: null
        });

        if (onValidationChange) {
          onValidationChange({ isValid: false, message: 'Error al validar el email' });
        }
      }
    };

    const timeoutId = setTimeout(validateEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [value, onValidationChange]);

  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { name: 'email', value: suggestion.email } });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    if (value && !value.includes('@')) {
      const emailSuggestions = generateEmailSuggestions(value);
      setSuggestions(emailSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const getValidationClass = () => {
    if (validationState.isValidating) return styles.validating;
    if (validationState.isValid === true) return styles.valid;
    if (validationState.isValid === false) return styles.invalid;
    return '';
  };

  const provider = getEmailProvider(value);

  return (
    <div className={styles.emailField}>
      <label className="form-label" htmlFor="email">
        Correo Electrónico {required && '*'}
        <small className={styles.helpText}>
          📧 Acepta Gmail, Yahoo, Hotmail, Outlook, iCloud, Nauta y otros proveedores
        </small>
      </label>
      
      <div className={styles.inputContainer}>
        <input
          className={`form-input ${getValidationClass()}`}
          type="email"
          name="email"
          id="email"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          autoComplete="email"
          spellCheck={false}
        />
        
        {/* Indicador de proveedor */}
        {provider && (
          <div className={styles.providerIndicator}>
            <span className={styles.providerIcon}>{provider.icon}</span>
            <span className={styles.providerName}>{provider.name}</span>
          </div>
        )}
        
        {/* Indicador de validación */}
        <div className={styles.validationIndicator}>
          {validationState.isValidating && (
            <span className={styles.spinner}>⏳</span>
          )}
          {validationState.isValid === true && (
            <span className={styles.successIcon}>✅</span>
          )}
          {validationState.isValid === false && (
            <span className={styles.errorIcon}>❌</span>
          )}
        </div>
      </div>

      {/* Mensaje de validación */}
      {validationState.message && (
        <div className={`${styles.validationMessage} ${
          validationState.isValid === false ? styles.errorMessage : styles.successMessage
        }`}>
          {validationState.message}
        </div>
      )}

      {/* Sugerencias de email */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <div className={styles.suggestionsHeader}>
            💡 Sugerencias de email:
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className={styles.suggestionIcon}>{suggestion.provider.icon}</span>
              <span className={styles.suggestionEmail}>{suggestion.email}</span>
              <span className={styles.suggestionProvider}>{suggestion.provider.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Información adicional para emails válidos */}
      {validationState.isValid === true && validationState.provider && (
        <div className={styles.providerInfo}>
          <span className={styles.providerIcon}>{validationState.provider.icon}</span>
          <span>
            Email de {validationState.provider.name} 
            {validationState.exists === true && ' - Formato válido'}
            {validationState.exists === false && ' - Cuenta no encontrada'}
          </span>
        </div>
      )}
    </div>
  );
};

export default EmailValidationField;