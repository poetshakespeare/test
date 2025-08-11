import React, { useState } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import styles from './ConfigManager.module.css';

const ConfigManager = () => {
  const { exportConfiguration, importConfiguration, resetConfiguration } = useConfigContext();
  const { updateProductsFromAdmin, updateCategoriesFromAdmin } = useAllProductsContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      exportConfiguration();
    } catch (error) {
      toastHandler(ToastType.Error, 'Error al exportar la configuración');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);

    try {
      // Leer el archivo
      const text = await file.text();
      const config = JSON.parse(text);
      
      // Validar estructura del archivo
      if (!config.storeInfo && !config.lastModified && !config.products && !config.categories) {
        throw new Error('Archivo de configuración inválido');
      }

      // Importar la configuración
      await importConfiguration(file);

      // SINCRONIZACIÓN MEJORADA: Actualizar productos y categorías si están en el archivo
      if (config.products && Array.isArray(config.products)) {
        console.log('🔄 Sincronizando productos desde configuración importada...');
        updateProductsFromAdmin(config.products);
        
        // Guardar en localStorage inmediatamente
        const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
        let currentConfig = {};
        try {
          currentConfig = JSON.parse(savedConfig);
        } catch (error) {
          currentConfig = {};
        }
        
        currentConfig.products = config.products;
        localStorage.setItem('adminStoreConfig', JSON.stringify(currentConfig));
        
        toastHandler(ToastType.Success, `✅ ${config.products.length} productos importados y sincronizados`);
      }

      if (config.categories && Array.isArray(config.categories)) {
        console.log('🔄 Sincronizando categorías desde configuración importada...');
        updateCategoriesFromAdmin(config.categories);
        
        // Guardar en localStorage inmediatamente
        const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
        let currentConfig = {};
        try {
          currentConfig = JSON.parse(savedConfig);
        } catch (error) {
          currentConfig = {};
        }
        
        currentConfig.categories = config.categories;
        localStorage.setItem('adminStoreConfig', JSON.stringify(currentConfig));
        
        toastHandler(ToastType.Success, `✅ ${config.categories.length} categorías importadas y sincronizadas`);
      }

      // Importar mensajes si están disponibles
      if (config.messages && typeof config.messages === 'object') {
        localStorage.setItem('storeMessages', JSON.stringify(config.messages));
        toastHandler(ToastType.Success, '✅ Mensajes importados exitosamente');
      }

      // Disparar eventos de sincronización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
        window.dispatchEvent(new CustomEvent('configurationImported', { 
          detail: { config } 
        }));
        window.dispatchEvent(new CustomEvent('adminPanelSync', { 
          detail: { type: 'fullconfig', data: config } 
        }));
      }, 100);

    } catch (error) {
      console.error('Error al importar configuración:', error);
      toastHandler(ToastType.Error, 'Error al importar la configuración: ' + error.message);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Estás seguro de restablecer toda la configuración a los valores por defecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpiar localStorage
      localStorage.removeItem('adminStoreConfig');
      localStorage.removeItem('storeMessages');
      
      // Restablecer configuración
      resetConfiguration();
      
      // Limpiar productos y categorías
      updateProductsFromAdmin([]);
      updateCategoriesFromAdmin([]);
      
      // Disparar eventos de sincronización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
        window.dispatchEvent(new CustomEvent('configurationReset'));
        window.dispatchEvent(new CustomEvent('adminPanelSync', { 
          detail: { type: 'reset', data: {} } 
        }));
      }, 100);
      
    } catch (error) {
      toastHandler(ToastType.Error, 'Error al restablecer la configuración');
    }
  };

  return (
    <div className={styles.configManager}>
      <h2>💾 Gestión de Configuración</h2>
      
      <div className={styles.configSection}>
        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <h3>📤 Exportar Configuración</h3>
          </div>
          <div className={styles.cardContent}>
            <p>
              Exporta toda la configuración de la tienda incluyendo productos, categorías,
              cupones, zonas de entrega, mensajes y configuraciones generales en un archivo JSON.
            </p>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={`btn btn-primary ${styles.actionButton}`}
            >
              {isExporting ? (
                <span className={styles.loading}>
                  <span className="loader-2"></span>
                  Exportando...
                </span>
              ) : (
                '📤 Exportar Configuración'
              )}
            </button>
          </div>
        </div>

        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <h3>📥 Importar Configuración</h3>
          </div>
          <div className={styles.cardContent}>
            <p>
              Importa una configuración previamente exportada. Esto sincronizará automáticamente
              productos, categorías, mensajes y toda la configuración de la tienda.
            </p>
            <div className={styles.importContainer}>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className={styles.fileInput}
                id="config-import"
              />
              <label 
                htmlFor="config-import" 
                className={`btn btn-success ${styles.actionButton} ${isImporting ? styles.disabled : ''}`}
              >
                {isImporting ? (
                  <span className={styles.loading}>
                    <span className="loader-2"></span>
                    Importando y sincronizando...
                  </span>
                ) : (
                  '📥 Seleccionar Archivo'
                )}
              </label>
            </div>
          </div>
        </div>

        <div className={styles.configCard}>
          <div className={styles.cardHeader}>
            <h3>🔄 Restablecer Configuración</h3>
          </div>
          <div className={styles.cardContent}>
            <p>
              Restablece toda la configuración de la tienda a los valores por defecto. 
              <strong> Esta acción no se puede deshacer.</strong>
            </p>
            <button 
              onClick={handleReset}
              className={`btn btn-danger ${styles.actionButton}`}
            >
              🔄 Restablecer a Valores por Defecto
            </button>
          </div>
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3>ℹ️ Información Importante</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>Formato del archivo:</strong> JSON (.json)
          </div>
          <div className={styles.infoItem}>
            <strong>Contenido incluido:</strong> Productos, categorías, cupones, zonas de entrega, mensajes, configuración general
          </div>
          <div className={styles.infoItem}>
            <strong>Sincronización automática:</strong> Los productos y categorías se sincronizan automáticamente al importar
          </div>
          <div className={styles.infoItem}>
            <strong>Compatibilidad:</strong> Solo archivos exportados desde esta versión del panel
          </div>
          <div className={styles.infoItem}>
            <strong>Seguridad:</strong> Realiza copias de seguridad antes de importar configuraciones
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManager;