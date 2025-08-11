import React, { useState, useEffect } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import styles from './CouponProductManager.module.css';

const CouponProductManager = () => {
  const { products: productsFromContext, updateProductsFromAdmin } = useAllProductsContext();
  const { updateProducts } = useConfigContext();
  const [localProducts, setLocalProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, enabled, disabled
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // CARGAR PRODUCTOS CON SINCRONIZACIÓN MEJORADA
  useEffect(() => {
    console.log('🔄 Cargando productos para control de cupones:', productsFromContext?.length || 0);
    
    // Cargar desde el contexto primero
    if (productsFromContext && productsFromContext.length > 0) {
      setLocalProducts(productsFromContext);
    } else {
      // Si no hay productos en el contexto, intentar cargar desde localStorage
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products && parsedConfig.products.length > 0) {
            console.log('📦 Cargando productos desde localStorage para cupones:', parsedConfig.products.length);
            setLocalProducts(parsedConfig.products);
            // Sincronizar con el contexto
            updateProductsFromAdmin(parsedConfig.products);
          }
        } catch (error) {
          console.error('Error al cargar productos desde localStorage:', error);
        }
      }
    }
  }, [productsFromContext, updateProductsFromAdmin]);

  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN DE PRODUCTOS
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      const { products: updatedProducts } = event.detail;
      console.log('📡 Evento de actualización de productos recibido en CouponProductManager');
      setLocalProducts(updatedProducts);
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración recibido en CouponProductManager');
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products) {
            setLocalProducts(parsedConfig.products);
          }
        } catch (error) {
          console.error('Error al cargar productos desde configuración:', error);
        }
      }
    };

    // Agregar listeners
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
  }, []);

  // Función para sincronización completa MEJORADA CON PERSISTENCIA GARANTIZADA
  const performCompleteSync = (updatedProducts) => {
    console.log('🔄 Iniciando sincronización completa de productos con cupones...');
    
    // 1. Actualizar estado local inmediatamente
    setLocalProducts(updatedProducts);
    
    // 2. Actualizar en localStorage para persistencia inmediata con verificación
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    config.products = updatedProducts;
    config.lastModified = new Date().toISOString();
    
    // Guardar con verificación
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Verificar que se guardó correctamente
    const verifyConfig = localStorage.getItem('adminStoreConfig');
    if (verifyConfig) {
      try {
        const parsedVerify = JSON.parse(verifyConfig);
        if (parsedVerify.products && parsedVerify.products.length === updatedProducts.length) {
          console.log('✅ Productos con configuración de cupones guardados correctamente en localStorage');
        }
      } catch (error) {
        console.error('Error en verificación de guardado:', error);
      }
    }
    
    // 3. Actualizar en el contexto de configuración para backup
    updateProducts(updatedProducts);
    
    // 4. Actualizar en el contexto de productos para sincronización inmediata en la tienda
    updateProductsFromAdmin(updatedProducts);
    
    // 5. Disparar múltiples eventos para garantizar sincronización completa
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: updatedProducts } 
      }));
      
      window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
      
      // NUEVO: Evento específico para cambios de configuración del admin
      window.dispatchEvent(new CustomEvent('adminConfigChanged', { 
        detail: { products: updatedProducts, type: 'products' } 
      }));
      
      // Forzar re-renderizado adicional
      window.dispatchEvent(new CustomEvent('productsConfigUpdated', { 
        detail: { products: updatedProducts } 
      }));
    }, 50);

    // 6. Verificación adicional para asegurar sincronización
    setTimeout(() => {
      const currentConfig = localStorage.getItem('adminStoreConfig');
      if (currentConfig) {
        try {
          const parsedConfig = JSON.parse(currentConfig);
          if (parsedConfig.products && parsedConfig.products.length === updatedProducts.length) {
            console.log('✅ Sincronización de productos con cupones verificada exitosamente');
            toastHandler(ToastType.Info, '🔄 Configuración de cupones sincronizada en tiempo real');
          }
        } catch (error) {
          console.error('Error en verificación de sincronización:', error);
        }
      }
    }, 200);

    console.log('✅ Sincronización de productos con cupones completada');
  };

  const toggleCouponEligibility = (productId) => {
    const updatedProducts = localProducts.map(product => {
      if (product._id === productId) {
        return {
          ...product,
          canUseCoupons: !product.canUseCoupons
        };
      }
      return product;
    });

    // SINCRONIZACIÓN COMPLETA
    performCompleteSync(updatedProducts);
    setHasUnsavedChanges(true);
    
    const product = localProducts.find(p => p._id === productId);
    toastHandler(ToastType.Success, 
      `✅ ${product.name}: ${product.canUseCoupons ? 'Cupones deshabilitados' : 'Cupones habilitados'}`
    );
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('couponProductsUpdated', { 
        detail: { products: updatedProducts } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'couponproducts', data: updatedProducts } 
      }));
    }, 10);
  };

  const toggleAllProducts = (enableCoupons) => {
    const updatedProducts = localProducts.map(product => ({
      ...product,
      canUseCoupons: enableCoupons
    }));

    // SINCRONIZACIÓN COMPLETA
    performCompleteSync(updatedProducts);
    setHasUnsavedChanges(true);
    
    toastHandler(ToastType.Success, 
      `✅ ${enableCoupons ? 'Cupones habilitados' : 'Cupones deshabilitados'} para todos los productos`
    );
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('couponProductsUpdated', { 
        detail: { products: updatedProducts } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'couponproducts', data: updatedProducts } 
      }));
    }, 10);
  };

  const saveChanges = () => {
    // Los cambios ya se han sincronizado en tiempo real
    setHasUnsavedChanges(false);
    toastHandler(ToastType.Success, '✅ Configuración de cupones guardada exitosamente');
    toastHandler(ToastType.Info, 'Los cambios se han aplicado en tiempo real en la tienda');
  };

  // Filtrar productos
  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && product.canUseCoupons) ||
                         (filterStatus === 'disabled' && !product.canUseCoupons);
    
    return matchesSearch && matchesFilter;
  });

  // Estadísticas
  const stats = {
    total: localProducts.length,
    enabled: localProducts.filter(p => p.canUseCoupons).length,
    disabled: localProducts.filter(p => !p.canUseCoupons).length
  };

  // Verificar si hay cambios pendientes
  const hasChanges = localProducts.length !== productsFromContext.length || 
    JSON.stringify(localProducts) !== JSON.stringify(productsFromContext);

  return (
    <div className={styles.couponProductManager}>
      <div className={styles.header}>
        <h2>🎫 Control de Cupones por Producto</h2>
        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.changesIndicator}>
              🟢 Cambios aplicados en tiempo real
            </span>
          )}
          {hasUnsavedChanges && (
            <button 
              onClick={saveChanges}
              className="btn btn-primary"
            >
              💾 Confirmar Cambios
            </button>
          )}
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Control de Cupones de Descuento</h4>
        <p>Configura qué productos pueden usar cupones de descuento. Los cupones solo se aplicarán si TODOS los productos en el carrito tienen esta opción habilitada. Los cambios se aplican automáticamente en la tienda en tiempo real.</p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>📊 Estado Actual de Cupones</h4>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.total}</span>
              <span className={styles.statLabel}>Total Productos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.enabled}</span>
              <span className={styles.statLabel}>Con Cupones</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.disabled}</span>
              <span className={styles.statLabel}>Sin Cupones</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES MASIVOS */}
      <div className={styles.bulkActions}>
        <h4>⚡ Acciones Masivas</h4>
        <div className={styles.bulkButtons}>
          <button 
            onClick={() => toggleAllProducts(true)}
            className="btn btn-success"
          >
            ✅ Habilitar Cupones para Todos
          </button>
          <button 
            onClick={() => toggleAllProducts(false)}
            className="btn btn-danger"
          >
            ❌ Deshabilitar Cupones para Todos
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`form-input ${styles.searchInput}`}
          />
        </div>

        <div className={styles.filterContainer}>
          <label>Filtrar por estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="all">🔍 Todos los productos</option>
            <option value="enabled">✅ Con cupones habilitados</option>
            <option value="disabled">❌ Sin cupones habilitados</option>
          </select>
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className={styles.productsList}>
        <div className={styles.listHeader}>
          <h3>Productos ({filteredProducts.length})</h3>
          {hasChanges && (
            <div className={styles.changesAlert}>
              <span>🟢 Los cambios se han aplicado en tiempo real en la tienda</span>
              <small>Ve a "🗂️ Sistema Backup" para exportar los cambios</small>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>🔍 No se encontraron productos</h3>
            <p>Intenta cambiar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filteredProducts.map(product => (
              <div key={product._id} className={styles.productCard}>
                <div className={styles.productImage}>
                  <img src={product.image} alt={product.name} />
                  <div className={`${styles.couponBadge} ${product.canUseCoupons ? styles.enabled : styles.disabled}`}>
                    {product.canUseCoupons ? '🎫 CON CUPONES' : '🚫 SIN CUPONES'}
                  </div>
                </div>
                
                <div className={styles.productInfo}>
                  <h4>{product.name}</h4>
                  <p className={styles.productCategory}>📂 {product.category}</p>
                  <p className={styles.productCompany}>🏢 {product.company}</p>
                  <p className={styles.productPrice}>${product.price.toLocaleString()} CUP</p>
                  
                  <div className={styles.couponStatus}>
                    <span className={`${styles.statusIndicator} ${product.canUseCoupons ? styles.statusEnabled : styles.statusDisabled}`}>
                      {product.canUseCoupons ? '✅ Puede usar cupones' : '❌ No puede usar cupones'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.productActions}>
                  <button
                    onClick={() => toggleCouponEligibility(product._id)}
                    className={`btn ${product.canUseCoupons ? 'btn-danger' : 'btn-success'}`}
                  >
                    {product.canUseCoupons ? '🚫 Deshabilitar Cupones' : '✅ Habilitar Cupones'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h3>ℹ️ Información del Sistema de Cupones</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>🎯 Funcionamiento:</strong> Los cupones solo se aplicarán si TODOS los productos en el carrito tienen cupones habilitados
          </div>
          <div className={styles.infoItem}>
            <strong>⚡ Tiempo Real:</strong> Los cambios se aplican inmediatamente en la tienda sin necesidad de recargar
          </div>
          <div className={styles.infoItem}>
            <strong>🔄 Sincronización:</strong> La configuración se sincroniza automáticamente con todos los componentes de la tienda
          </div>
          <div className={styles.infoItem}>
            <strong>💾 Persistencia:</strong> Los cambios se guardan automáticamente y se incluyen en el backup del sistema
          </div>
          <div className={styles.infoItem}>
            <strong>🛒 Carrito:</strong> Si hay productos mixtos (con y sin cupones), no se aplicarán descuentos
          </div>
          <div className={styles.infoItem}>
            <strong>📦 Exportación:</strong> Ve a "🗂️ Sistema Backup" para exportar la configuración actualizada
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponProductManager;