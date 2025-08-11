import React, { createContext, useContext, useState, useEffect } from 'react';
import { toastHandler } from '../utils/utils';
import { ToastType, DEFAULT_STORE_CONFIG, COUPONS, SANTIAGO_ZONES } from '../constants/constants';

const ConfigContext = createContext(null);

export const useConfigContext = () => useContext(ConfigContext);

const ConfigContextProvider = ({ children }) => {
  const [storeConfig, setStoreConfig] = useState({
    storeInfo: DEFAULT_STORE_CONFIG,
    coupons: COUPONS,
    zones: SANTIAGO_ZONES,
    products: [],
    categories: [],
    lastModified: new Date().toISOString()
  });

  // Cargar configuración desde localStorage al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('adminStoreConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setStoreConfig(parsedConfig);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }, []);

  // Guardar configuración en localStorage cuando cambie
  const saveConfig = (newConfig) => {
    const updatedConfig = {
      ...newConfig,
      lastModified: new Date().toISOString()
    };
    
    setStoreConfig(updatedConfig);
    localStorage.setItem('adminStoreConfig', JSON.stringify(updatedConfig));
    toastHandler(ToastType.Success, 'Configuración guardada exitosamente');
  };

  // Actualizar cupones
  const updateCoupons = (newCoupons) => {
    const updatedConfig = {
      ...storeConfig,
      coupons: newCoupons,
      lastModified: new Date().toISOString()
    };
    saveConfig(updatedConfig);
    
    // Disparar eventos de sincronización
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('couponsUpdated', { 
        detail: { coupons: newCoupons } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'coupons', data: newCoupons } 
      }));
    }, 10);
  };

  // Actualizar zonas
  const updateZones = (newZones) => {
    const updatedConfig = {
      ...storeConfig,
      zones: newZones,
      lastModified: new Date().toISOString()
    };
    saveConfig(updatedConfig);
    
    // Disparar eventos de sincronización
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('zonesUpdated', { 
        detail: { zones: newZones } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'zones', data: newZones } 
      }));
    }, 10);
  };

  // Actualizar información de la tienda
  const updateStoreInfo = (newStoreInfo) => {
    const updatedConfig = {
      ...storeConfig,
      storeInfo: newStoreInfo,
      lastModified: new Date().toISOString()
    };
    saveConfig(updatedConfig);
    
    // Disparar eventos de sincronización
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storeInfoUpdated', { 
        detail: { storeInfo: newStoreInfo } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'storeInfo', data: newStoreInfo } 
      }));
    }, 10);
  };

  // Actualizar productos - MEJORADA PARA MANTENER ESTRUCTURA EXACTA
  const updateProducts = (newProducts) => {
    const updatedConfig = {
      ...storeConfig,
      products: newProducts,
      lastModified: new Date().toISOString()
    };
    
    // Guardar en localStorage manteniendo estructura exacta
    setStoreConfig(updatedConfig);
    localStorage.setItem('adminStoreConfig', JSON.stringify(updatedConfig));
    
    // Disparar evento para sincronización global
    window.dispatchEvent(new CustomEvent('productsConfigUpdated', { 
      detail: { products: newProducts } 
    }));
    
    // Sincronización adicional
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'products', data: newProducts } 
      }));
    }, 10);
    
    toastHandler(ToastType.Success, 'Productos actualizados en la configuración');
  };

  // Actualizar categorías - MEJORADA PARA MANTENER ESTRUCTURA EXACTA
  const updateCategories = (newCategories) => {
    const updatedConfig = {
      ...storeConfig,
      categories: newCategories,
      lastModified: new Date().toISOString()
    };
    
    // Guardar en localStorage manteniendo estructura exacta
    setStoreConfig(updatedConfig);
    localStorage.setItem('adminStoreConfig', JSON.stringify(updatedConfig));
    
    // Disparar evento para sincronización global
    window.dispatchEvent(new CustomEvent('categoriesConfigUpdated', { 
      detail: { categories: newCategories } 
    }));
    
    // Sincronización adicional
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'categories', data: newCategories } 
      }));
    }, 10);
    
    toastHandler(ToastType.Success, 'Categorías actualizadas en la configuración');
  };

  // Exportar configuración
  const exportConfiguration = () => {
    const configToExport = {
      ...storeConfig,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const dataStr = JSON.stringify(configToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gada-electronics-config-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toastHandler(ToastType.Success, 'Configuración exportada exitosamente');
  };

  // Importar configuración
  const importConfiguration = async (file) => {
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      // Validar estructura del archivo
      if (!config.storeInfo || !config.lastModified) {
        throw new Error('Archivo de configuración inválido');
      }

      saveConfig(config);
      toastHandler(ToastType.Success, 'Configuración importada exitosamente');
      
      // Recargar la página para aplicar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      toastHandler(ToastType.Error, 'Error al importar la configuración: ' + error.message);
    }
  };

  // Restablecer configuración
  const resetConfiguration = () => {
    const defaultConfig = {
      storeInfo: DEFAULT_STORE_CONFIG,
      coupons: COUPONS,
      zones: SANTIAGO_ZONES,
      products: [],
      categories: [],
      lastModified: new Date().toISOString()
    };
    
    saveConfig(defaultConfig);
    toastHandler(ToastType.Success, 'Configuración restablecida a valores por defecto');
  };

  return (
    <ConfigContext.Provider value={{
      storeConfig,
      updateCoupons,
      updateZones,
      updateStoreInfo,
      updateProducts,
      updateCategories,
      exportConfiguration,
      importConfiguration,
      resetConfiguration,
      saveConfig
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContextProvider;