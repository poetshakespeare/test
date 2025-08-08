import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useCurrencyContext } from '../../../contexts/CurrencyContextProvider';
import styles from './BankTransferManager.module.css';

const BankTransferManager = () => {
  const { storeConfig, saveConfig } = useConfigContext();
  const { products: productsFromContext, categories: categoriesFromContext, updateProductsFromAdmin } = useAllProductsContext();
  const { formatPriceWithCode } = useCurrencyContext();
  
  const [localProducts, setLocalProducts] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Configuración de recargos por transferencia bancaria
  const [bankTransferConfig, setBankTransferConfig] = useState({
    defaultSurcharge: 20, // Porcentaje por defecto
    categorySpecificSurcharges: {}, // Recargos específicos por categoría
    isEnabled: true, // Si el sistema está habilitado
    lastModified: new Date().toISOString()
  });

  // CARGAR CONFIGURACIÓN INICIAL
  useEffect(() => {
    console.log('🔄 Cargando configuración de transferencia bancaria...');
    
    // Cargar productos y categorías
    if (productsFromContext && productsFromContext.length > 0) {
      setLocalProducts(productsFromContext);
    }
    
    if (categoriesFromContext && categoriesFromContext.length > 0) {
      setLocalCategories(categoriesFromContext);
    }

    // Cargar configuración de transferencia bancaria desde localStorage
    const savedConfig = localStorage.getItem('adminStoreConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.bankTransferConfig) {
          setBankTransferConfig(parsedConfig.bankTransferConfig);
        } else {
          // Crear configuración por defecto si no existe
          const defaultConfig = {
            defaultSurcharge: 20,
            categorySpecificSurcharges: {},
            isEnabled: true,
            lastModified: new Date().toISOString()
          };
          setBankTransferConfig(defaultConfig);
          saveBankTransferConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Error al cargar configuración de transferencia bancaria:', error);
      }
    }
  }, [productsFromContext, categoriesFromContext]);

  // FUNCIÓN PARA GUARDAR CONFIGURACIÓN DE TRANSFERENCIA BANCARIA
  const saveBankTransferConfig = (newConfig) => {
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    config.bankTransferConfig = {
      ...newConfig,
      lastModified: new Date().toISOString()
    };
    
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Actualizar en el contexto de configuración
    saveConfig(config);
    
    // Disparar eventos para sincronización en tiempo real
    window.dispatchEvent(new CustomEvent('bankTransferConfigUpdated', { 
      detail: { bankTransferConfig: config.bankTransferConfig } 
    }));
    
    window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
    
    setHasUnsavedChanges(false);
    toastHandler(ToastType.Success, '✅ Configuración de transferencia bancaria actualizada en tiempo real');
  };

  // FUNCIÓN PARA ACTUALIZAR PRODUCTOS CON RECARGOS ESPECÍFICOS
  const updateProductsWithSurcharges = (updatedConfig) => {
    const updatedProducts = localProducts.map(product => {
      // Obtener el recargo específico para la categoría del producto
      const categorySpecificSurcharge = updatedConfig.categorySpecificSurcharges[product.category];
      const productSurcharge = categorySpecificSurcharge !== undefined 
        ? categorySpecificSurcharge 
        : updatedConfig.defaultSurcharge;

      return {
        ...product,
        bankTransferSurcharge: productSurcharge,
        bankTransferEnabled: updatedConfig.isEnabled
      };
    });

    // Sincronizar productos actualizados
    setLocalProducts(updatedProducts);
    updateProductsFromAdmin(updatedProducts);
    
    // Guardar productos actualizados en localStorage
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      config = {};
    }

    config.products = updatedProducts;
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Disparar eventos de sincronización
    window.dispatchEvent(new CustomEvent('productsUpdated', { 
      detail: { products: updatedProducts } 
    }));
  };

  // MANEJAR CAMBIO EN RECARGO POR DEFECTO
  const handleDefaultSurchargeChange = (e) => {
    const newSurcharge = parseFloat(e.target.value) || 0;
    
    if (newSurcharge < 0 || newSurcharge > 100) {
      toastHandler(ToastType.Error, 'El recargo debe estar entre 0% y 100%');
      return;
    }

    const updatedConfig = {
      ...bankTransferConfig,
      defaultSurcharge: newSurcharge
    };

    setBankTransferConfig(updatedConfig);
    setHasUnsavedChanges(true);
  };

  // MANEJAR CAMBIO EN RECARGO POR CATEGORÍA
  const handleCategorySurchargeChange = (categoryName, surcharge) => {
    const newSurcharge = parseFloat(surcharge) || 0;
    
    if (newSurcharge < 0 || newSurcharge > 100) {
      toastHandler(ToastType.Error, 'El recargo debe estar entre 0% y 100%');
      return;
    }

    const updatedConfig = {
      ...bankTransferConfig,
      categorySpecificSurcharges: {
        ...bankTransferConfig.categorySpecificSurcharges,
        [categoryName]: newSurcharge
      }
    };

    setBankTransferConfig(updatedConfig);
    setHasUnsavedChanges(true);
  };

  // ELIMINAR RECARGO ESPECÍFICO DE CATEGORÍA
  const removeCategorySurcharge = (categoryName) => {
    const { [categoryName]: removed, ...remainingSurcharges } = bankTransferConfig.categorySpecificSurcharges;
    
    const updatedConfig = {
      ...bankTransferConfig,
      categorySpecificSurcharges: remainingSurcharges
    };

    setBankTransferConfig(updatedConfig);
    setHasUnsavedChanges(true);
    toastHandler(ToastType.Success, `Recargo específico removido para ${categoryName}`);
  };

  // GUARDAR TODOS LOS CAMBIOS
  const handleSaveChanges = () => {
    // Guardar configuración de transferencia bancaria
    saveBankTransferConfig(bankTransferConfig);
    
    // Actualizar productos con los nuevos recargos
    updateProductsWithSurcharges(bankTransferConfig);
    
    toastHandler(ToastType.Success, '🎉 Configuración de transferencia bancaria guardada y aplicada en tiempo real');
  };

  // HABILITAR/DESHABILITAR SISTEMA
  const toggleBankTransferSystem = () => {
    const updatedConfig = {
      ...bankTransferConfig,
      isEnabled: !bankTransferConfig.isEnabled
    };

    setBankTransferConfig(updatedConfig);
    setHasUnsavedChanges(true);
  };

  // OBTENER RECARGO PARA UNA CATEGORÍA ESPECÍFICA
  const getSurchargeForCategory = (categoryName) => {
    return bankTransferConfig.categorySpecificSurcharges[categoryName] !== undefined
      ? bankTransferConfig.categorySpecificSurcharges[categoryName]
      : bankTransferConfig.defaultSurcharge;
  };

  // CALCULAR ESTADÍSTICAS
  const getStats = () => {
    const categoriesWithCustomSurcharge = Object.keys(bankTransferConfig.categorySpecificSurcharges).length;
    const categoriesUsingDefault = localCategories.length - categoriesWithCustomSurcharge;
    const averageSurcharge = localCategories.length > 0 
      ? localCategories.reduce((sum, cat) => sum + getSurchargeForCategory(cat.categoryName), 0) / localCategories.length
      : bankTransferConfig.defaultSurcharge;

    return {
      totalCategories: localCategories.length,
      categoriesWithCustomSurcharge,
      categoriesUsingDefault,
      averageSurcharge: Math.round(averageSurcharge * 100) / 100
    };
  };

  const stats = getStats();

  // SIMULAR CÁLCULO DE RECARGO PARA EJEMPLO
  const simulateExample = () => {
    const examplePrice = 100000; // 100,000 CUP
    const exampleSurcharge = bankTransferConfig.defaultSurcharge;
    const surchargeAmount = (examplePrice * exampleSurcharge) / 100;
    const totalWithSurcharge = examplePrice + surchargeAmount;

    return {
      originalPrice: examplePrice,
      surchargeAmount,
      totalWithSurcharge,
      surchargePercent: exampleSurcharge
    };
  };

  const example = simulateExample();

  return (
    <div className={styles.bankTransferManager}>
      <div className={styles.header}>
        <h2>🏦 Gestión de Recargos por Transferencia Bancaria</h2>
        <div className={styles.headerActions}>
          {hasUnsavedChanges && (
            <span className={styles.changesIndicator}>
              🔴 Cambios pendientes
            </span>
          )}
          <button 
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className="btn btn-primary"
          >
            💾 Guardar Cambios
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Sistema de Recargos por Transferencia Bancaria</h4>
        <p>
          Configura los porcentajes de recargo que se aplicarán cuando los clientes elijan pagar por transferencia bancaria. 
          Puedes establecer un recargo por defecto y recargos específicos por categoría de productos. 
          Los cambios se aplican automáticamente en toda la tienda en tiempo real.
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>📊 Estado Actual del Sistema</h4>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{bankTransferConfig.defaultSurcharge}%</span>
              <span className={styles.statLabel}>Recargo Por Defecto</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.categoriesWithCustomSurcharge}</span>
              <span className={styles.statLabel}>Categorías Personalizadas</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.averageSurcharge}%</span>
              <span className={styles.statLabel}>Recargo Promedio</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statNumber} ${bankTransferConfig.isEnabled ? styles.enabled : styles.disabled}`}>
                {bankTransferConfig.isEnabled ? '✅' : '❌'}
              </span>
              <span className={styles.statLabel}>Sistema {bankTransferConfig.isEnabled ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* EJEMPLO DE CÁLCULO */}
      <div className={styles.exampleSection}>
        <h4>💡 Ejemplo de Cálculo</h4>
        <div className={styles.exampleCard}>
          <div className={styles.exampleRow}>
            <span>Precio del producto:</span>
            <span>{formatPriceWithCode(example.originalPrice)}</span>
          </div>
          <div className={styles.exampleRow}>
            <span>Recargo por transferencia ({example.surchargePercent}%):</span>
            <span className={styles.surchargeAmount}>+{formatPriceWithCode(example.surchargeAmount)}</span>
          </div>
          <div className={`${styles.exampleRow} ${styles.totalRow}`}>
            <span>Total a pagar por transferencia:</span>
            <span className={styles.totalAmount}>{formatPriceWithCode(example.totalWithSurcharge)}</span>
          </div>
        </div>
      </div>

      {/* CONFIGURACIÓN GENERAL */}
      <div className={styles.generalConfig}>
        <h3>⚙️ Configuración General</h3>
        
        <div className={styles.configRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={bankTransferConfig.isEnabled}
              onChange={toggleBankTransferSystem}
            />
            <span className={styles.toggleSlider}></span>
            Sistema de Recargos por Transferencia Bancaria
          </label>
          <span className={`${styles.statusBadge} ${bankTransferConfig.isEnabled ? styles.active : styles.inactive}`}>
            {bankTransferConfig.isEnabled ? '✅ ACTIVO' : '❌ INACTIVO'}
          </span>
        </div>

        <div className={styles.formGroup}>
          <label>💰 Recargo Por Defecto (%)</label>
          <div className={styles.inputWithInfo}>
            <input
              type="number"
              value={bankTransferConfig.defaultSurcharge}
              onChange={handleDefaultSurchargeChange}
              className="form-input"
              min="0"
              max="100"
              step="0.1"
              disabled={!bankTransferConfig.isEnabled}
            />
            <small>
              Este porcentaje se aplicará a todas las categorías que no tengan un recargo específico configurado.
            </small>
          </div>
        </div>
      </div>

      {/* CONFIGURACIÓN POR CATEGORÍAS */}
      <div className={styles.categoryConfig}>
        <h3>📂 Recargos Específicos por Categoría</h3>
        <p className={styles.categoryDescription}>
          Configura recargos personalizados para categorías específicas. Si no se configura un recargo específico, 
          se usará el recargo por defecto ({bankTransferConfig.defaultSurcharge}%).
        </p>

        <div className={styles.categoriesGrid}>
          {localCategories.filter(cat => !cat.disabled).map(category => {
            const categoryName = category.categoryName;
            const currentSurcharge = getSurchargeForCategory(categoryName);
            const hasCustomSurcharge = bankTransferConfig.categorySpecificSurcharges[categoryName] !== undefined;
            const productsInCategory = localProducts.filter(p => p.category === categoryName).length;

            return (
              <div key={category._id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <h4>{categoryName}</h4>
                    <span className={styles.productCount}>
                      {productsInCategory} producto{productsInCategory !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.categoryImage}>
                    <img src={category.categoryImage} alt={categoryName} />
                  </div>
                </div>

                <div className={styles.categoryBody}>
                  <div className={styles.surchargeConfig}>
                    <label>Recargo para esta categoría (%):</label>
                    <div className={styles.surchargeInputContainer}>
                      <input
                        type="number"
                        value={hasCustomSurcharge ? currentSurcharge : ''}
                        onChange={(e) => handleCategorySurchargeChange(categoryName, e.target.value)}
                        className="form-input"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder={`Por defecto: ${bankTransferConfig.defaultSurcharge}%`}
                        disabled={!bankTransferConfig.isEnabled}
                      />
                      {hasCustomSurcharge && (
                        <button
                          onClick={() => removeCategorySurcharge(categoryName)}
                          className={`btn btn-danger ${styles.removeBtn}`}
                          title="Usar recargo por defecto"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.surchargeDisplay}>
                    <div className={styles.currentSurcharge}>
                      <span className={styles.surchargeLabel}>Recargo actual:</span>
                      <span className={`${styles.surchargeValue} ${hasCustomSurcharge ? styles.custom : styles.default}`}>
                        {currentSurcharge}%
                        {hasCustomSurcharge ? ' (Personalizado)' : ' (Por defecto)'}
                      </span>
                    </div>
                    
                    {productsInCategory > 0 && (
                      <div className={styles.exampleCalculation}>
                        <small>
                          Ejemplo: Producto de {formatPriceWithCode(50000)} → 
                          Total con transferencia: {formatPriceWithCode(50000 + (50000 * currentSurcharge / 100))}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISTA PREVIA DE PRODUCTOS AFECTADOS */}
      <div className={styles.productsPreview}>
        <h3>📦 Vista Previa de Productos con Recargos</h3>
        <div className={styles.productsGrid}>
          {localProducts.slice(0, 6).map(product => {
            const productSurcharge = getSurchargeForCategory(product.category);
            const hasCustomSurcharge = bankTransferConfig.categorySpecificSurcharges[product.category] !== undefined;
            const surchargeAmount = (product.price * productSurcharge) / 100;
            const totalWithSurcharge = product.price + surchargeAmount;

            return (
              <div key={product._id} className={styles.productPreviewCard}>
                <div className={styles.productImage}>
                  <img src={product.image} alt={product.name} />
                </div>
                <div className={styles.productInfo}>
                  <h5>{product.name}</h5>
                  <p className={styles.productCategory}>📂 {product.category}</p>
                  <div className={styles.priceBreakdown}>
                    <div className={styles.priceRow}>
                      <span>Precio base:</span>
                      <span>{formatPriceWithCode(product.price)}</span>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Recargo ({productSurcharge}%):</span>
                      <span className={styles.surchargeAmount}>+{formatPriceWithCode(surchargeAmount)}</span>
                    </div>
                    <div className={`${styles.priceRow} ${styles.totalRow}`}>
                      <span>Total transferencia:</span>
                      <span className={styles.totalAmount}>{formatPriceWithCode(totalWithSurcharge)}</span>
                    </div>
                  </div>
                  <div className={styles.surchargeType}>
                    <span className={`${styles.typeIndicator} ${hasCustomSurcharge ? styles.custom : styles.default}`}>
                      {hasCustomSurcharge ? '🎯 Recargo Personalizado' : '⚙️ Recargo Por Defecto'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {localProducts.length > 6 && (
          <p className={styles.moreProducts}>
            ... y {localProducts.length - 6} productos más se actualizarán con la nueva configuración
          </p>
        )}
      </div>

      {/* INFORMACIÓN DEL SISTEMA */}
      <div className={styles.infoSection}>
        <h3>ℹ️ Información del Sistema de Recargos</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>🎯 Funcionamiento:</strong> 
            Los recargos se aplican automáticamente cuando el cliente selecciona transferencia bancaria como método de pago
          </div>
          <div className={styles.infoItem}>
            <strong>📂 Prioridad de Categorías:</strong> 
            Si una categoría tiene un recargo específico, se usa ese porcentaje. Si no, se usa el recargo por defecto
          </div>
          <div className={styles.infoItem}>
            <strong>⚡ Tiempo Real:</strong> 
            Los cambios se aplican inmediatamente en toda la tienda sin necesidad de recargar
          </div>
          <div className={styles.infoItem}>
            <strong>🛒 Carrito Mixto:</strong> 
            Si el carrito tiene productos de diferentes categorías, cada producto usa su recargo correspondiente
          </div>
          <div className={styles.infoItem}>
            <strong>💾 Persistencia:</strong> 
            Los cambios se guardan automáticamente y se incluyen en el sistema de backup
          </div>
          <div className={styles.infoItem}>
            <strong>📱 Información al Cliente:</strong> 
            Los clientes verán el recargo específico de cada producto en la página de detalles
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferManager;