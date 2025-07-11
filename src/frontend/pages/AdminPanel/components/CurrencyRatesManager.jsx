import React, { useState, useEffect } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useCurrencyContext } from '../../../contexts/CurrencyContextProvider';
import styles from './CurrencyRatesManager.module.css';

const CurrencyRatesManager = () => {
  const { getAvailableCurrencies, getCurrentCurrency } = useCurrencyContext();
  const [currencies, setCurrencies] = useState([]);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    flag: '',
    rate: ''
  });

  // Cargar monedas desde localStorage o usar las por defecto
  useEffect(() => {
    const savedConfig = localStorage.getItem('adminStoreConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.currencies) {
          setCurrencies(Object.values(parsedConfig.currencies));
        } else {
          loadDefaultCurrencies();
        }
      } catch (error) {
        console.error('Error al cargar monedas:', error);
        loadDefaultCurrencies();
      }
    } else {
      loadDefaultCurrencies();
    }
  }, []);

  const loadDefaultCurrencies = () => {
    const defaultCurrencies = getAvailableCurrencies();
    setCurrencies(defaultCurrencies);
    saveCurrencies(defaultCurrencies);
  };

  const saveCurrencies = (newCurrencies) => {
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    // Convertir array a objeto con código como clave
    const currenciesObject = newCurrencies.reduce((acc, currency) => {
      acc[currency.code] = currency;
      return acc;
    }, {});

    config.currencies = currenciesObject;
    config.lastModified = new Date().toISOString();
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));

    // Disparar evento para actualización en tiempo real
    window.dispatchEvent(new CustomEvent('currenciesUpdated', { 
      detail: { currencies: currenciesObject } 
    }));

    setHasUnsavedChanges(false);
    toastHandler(ToastType.Success, '✅ Tasas de conversión actualizadas en tiempo real');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrencyForm(prev => ({
      ...prev,
      [name]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!currencyForm.code.trim()) {
      toastHandler(ToastType.Error, 'El código de moneda es requerido');
      return;
    }
    
    if (!currencyForm.name.trim()) {
      toastHandler(ToastType.Error, 'El nombre de la moneda es requerido');
      return;
    }

    if (!currencyForm.symbol.trim()) {
      toastHandler(ToastType.Error, 'El símbolo es requerido');
      return;
    }

    if (!currencyForm.rate || parseFloat(currencyForm.rate) <= 0) {
      toastHandler(ToastType.Error, 'La tasa debe ser mayor a 0');
      return;
    }

    // Verificar código duplicado
    const isDuplicate = currencies.some(currency => 
      currency.code.toUpperCase() === currencyForm.code.toUpperCase() && 
      currency.code !== editingCurrency?.code
    );

    if (isDuplicate) {
      toastHandler(ToastType.Error, 'Ya existe una moneda con este código');
      return;
    }

    const newCurrency = {
      code: currencyForm.code.toUpperCase(),
      name: currencyForm.name.trim(),
      symbol: currencyForm.symbol.trim(),
      flag: currencyForm.flag.trim() || '💱',
      rate: parseFloat(currencyForm.rate)
    };

    let updatedCurrencies;
    if (editingCurrency) {
      updatedCurrencies = currencies.map(c => c.code === editingCurrency.code ? newCurrency : c);
      toastHandler(ToastType.Success, '✅ Moneda actualizada exitosamente');
    } else {
      updatedCurrencies = [...currencies, newCurrency];
      toastHandler(ToastType.Success, '✅ Moneda creada exitosamente');
    }

    setCurrencies(updatedCurrencies);
    saveCurrencies(updatedCurrencies);
    resetForm();
  };

  const resetForm = () => {
    setCurrencyForm({
      code: '',
      name: '',
      symbol: '',
      flag: '',
      rate: ''
    });
    setEditingCurrency(null);
    setHasUnsavedChanges(false);
  };

  const editCurrency = (currency) => {
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      flag: currency.flag,
      rate: currency.rate.toString()
    });
    setEditingCurrency(currency);
    setHasUnsavedChanges(false);
  };

  const deleteCurrency = (currencyCode) => {
    if (currencyCode === 'CUP') {
      toastHandler(ToastType.Error, 'No se puede eliminar la moneda base (CUP)');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar esta moneda?')) {
      return;
    }

    const updatedCurrencies = currencies.filter(c => c.code !== currencyCode);
    setCurrencies(updatedCurrencies);
    saveCurrencies(updatedCurrencies);
    toastHandler(ToastType.Success, '✅ Moneda eliminada exitosamente');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    resetForm();
  };

  const currentCurrency = getCurrentCurrency();

  return (
    <div className={styles.currencyManager}>
      <div className={styles.header}>
        <h2>💱 Gestión de Tasas de Conversión</h2>
        <div className={styles.headerActions}>
          {hasUnsavedChanges && (
            <span className={styles.changesIndicator}>
              🔴 Cambios sin guardar
            </span>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setEditingCurrency({})}
          >
            + Nueva Moneda
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Información Importante</h4>
        <p>Las tasas de conversión se aplican automáticamente en toda la tienda. CUP es la moneda base (tasa = 1). Las tasas representan cuántos CUP equivalen a 1 unidad de la moneda extranjera. Los cambios se reflejan inmediatamente en los precios mostrados.</p>
      </div>

      {/* MONEDA ACTUAL */}
      <div className={styles.currentCurrency}>
        <h4>💰 Moneda Actualmente Seleccionada:</h4>
        <div className={styles.currentCurrencyDisplay}>
          <span className={styles.flag}>{currentCurrency.flag}</span>
          <span className={styles.currencyName}>{currentCurrency.name}</span>
          <span className={styles.currencyCode}>({currentCurrency.code})</span>
          {currentCurrency.code !== 'CUP' && (
            <span className={styles.rate}>1 {currentCurrency.code} = {currentCurrency.rate.toLocaleString()} CUP</span>
          )}
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>📊 Estado de las Monedas</h4>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{currencies.length}</span>
              <span className={styles.statLabel}>Total Monedas</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{currencies.filter(c => c.code !== 'CUP').length}</span>
              <span className={styles.statLabel}>Monedas Extranjeras</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {currencies.length > 0 ? Math.max(...currencies.map(c => c.rate)).toLocaleString() : 0}
              </span>
              <span className={styles.statLabel}>Tasa Más Alta</span>
            </div>
          </div>
        </div>
      </div>

      {editingCurrency && (
        <form className={styles.currencyForm} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3>{editingCurrency.code ? 'Editar Moneda' : 'Nueva Moneda'}</h3>
            {hasUnsavedChanges && (
              <span className={styles.unsavedIndicator}>
                🔴 Cambios sin guardar
              </span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Código de Moneda * (3 letras)</label>
              <input
                type="text"
                name="code"
                value={currencyForm.code}
                onChange={handleInputChange}
                className="form-input"
                placeholder="USD"
                maxLength="3"
                style={{ textTransform: 'uppercase' }}
                disabled={editingCurrency.code === 'CUP'}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nombre de la Moneda *</label>
              <input
                type="text"
                name="name"
                value={currencyForm.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Dólar Estadounidense"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Símbolo *</label>
              <input
                type="text"
                name="symbol"
                value={currencyForm.symbol}
                onChange={handleInputChange}
                className="form-input"
                placeholder="$"
                maxLength="5"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Emoji/Bandera</label>
              <input
                type="text"
                name="flag"
                value={currencyForm.flag}
                onChange={handleInputChange}
                className="form-input"
                placeholder="🇺🇸"
                maxLength="10"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Tasa de Conversión * (1 {currencyForm.code || 'MONEDA'} = X CUP)</label>
            <input
              type="number"
              name="rate"
              value={currencyForm.rate}
              onChange={handleInputChange}
              className="form-input"
              placeholder="320"
              min="0"
              step="0.01"
              disabled={editingCurrency.code === 'CUP'}
              required
            />
            {currencyForm.rate && currencyForm.code && (
              <small className={styles.conversionExample}>
                Ejemplo: 1 {currencyForm.code} = {parseFloat(currencyForm.rate || 0).toLocaleString()} CUP
              </small>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              💾 {editingCurrency.code ? 'Actualizar' : 'Crear'} Moneda
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-hipster">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.currenciesList}>
        <div className={styles.listHeader}>
          <h3>Monedas Configuradas ({currencies.length})</h3>
        </div>

        <div className={styles.currenciesGrid}>
          {currencies.map(currency => (
            <div key={currency.code} className={`${styles.currencyCard} ${currency.code === currentCurrency.code ? styles.activeCurrency : ''}`}>
              <div className={styles.currencyHeader}>
                <div className={styles.currencyFlag}>{currency.flag}</div>
                <div className={styles.currencyCode}>{currency.code}</div>
                {currency.code === currentCurrency.code && (
                  <span className={styles.activeBadge}>ACTIVA</span>
                )}
              </div>
              
              <div className={styles.currencyInfo}>
                <h4>{currency.name}</h4>
                <p className={styles.currencySymbol}>Símbolo: {currency.symbol}</p>
                <div className={styles.currencyRate}>
                  {currency.code === 'CUP' ? (
                    <span className={styles.baseCurrency}>Moneda Base</span>
                  ) : (
                    <span>1 {currency.code} = {currency.rate.toLocaleString()} CUP</span>
                  )}
                </div>
              </div>
              
              <div className={styles.currencyActions}>
                <button
                  onClick={() => editCurrency(currency)}
                  className="btn btn-primary"
                >
                  Editar
                </button>
                {currency.code !== 'CUP' && (
                  <button
                    onClick={() => deleteCurrency(currency.code)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3>ℹ️ Información del Sistema de Monedas</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>🇨🇺 CUP (Peso Cubano):</strong> Moneda base del sistema, no se puede eliminar ni cambiar su tasa
          </div>
          <div className={styles.infoItem}>
            <strong>💱 Tasas de Conversión:</strong> Representan cuántos CUP equivalen a 1 unidad de la moneda extranjera
          </div>
          <div className={styles.infoItem}>
            <strong>⚡ Tiempo Real:</strong> Los cambios se aplican inmediatamente en toda la tienda
          </div>
          <div className={styles.infoItem}>
            <strong>🔄 Sincronización:</strong> Las tasas se sincronizan automáticamente con el sistema de precios
          </div>
          <div className={styles.infoItem}>
            <strong>💾 Persistencia:</strong> Los cambios se guardan automáticamente y se incluyen en el backup
          </div>
          <div className={styles.infoItem}>
            <strong>📦 Exportación:</strong> Ve a "🗂️ Sistema Backup" para exportar las tasas actualizadas
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyRatesManager;