import React, { useState, useEffect } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType, PAYMENT_TYPES, TRANSFER_CONFIG } from '../../../constants/constants';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import { useCurrencyContext } from '../../../contexts/CurrencyContextProvider';
import styles from './PaymentConfigManager.module.css';

const PaymentConfigManager = () => {
  const { products: productsFromContext, updateProductsFromAdmin } = useAllProductsContext();
  const { updateProducts } = useConfigContext();
  const { formatPriceWithCode } = useCurrencyContext();
  const [localProducts, setLocalProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // CARGAR PRODUCTOS CON SINCRONIZACIÓN MEJORADA
  useEffect(() => {
    console.log('🔄 Cargando productos para configuración de pagos:', productsFromContext?.length || 0);
    
    if (productsFromContext && productsFromContext.length > 0) {
      setLocalProducts(productsFromContext);
    } else {
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products && parsedConfig.products.length > 0) {
            console.log('📦 Cargando productos desde localStorage para pagos:', parsedConfig.products.length);
            setLocalProducts(parsedConfig.products);
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
      console.log('📡 Evento de actualización de productos recibido en PaymentConfigManager');
      setLocalProducts(updatedProducts);
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración recibido en PaymentConfigManager');
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

    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);

    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('forceStoreUpdate', handleConfigUpdate);
      window.removeEventListener('adminConfigChanged', handleConfigUpdate);
    };
  }, []);

  // Función para sincronización completa
  const performCompleteSync = (updatedProducts) => {
    console.log('🔄 Iniciando sincronización completa de configuración de pagos...');
    
    setLocalProducts(updatedProducts);
    
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
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    updateProducts(updatedProducts);
    updateProductsFromAdmin(updatedProducts);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: updatedProducts } 
      }));
      window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
      window.dispatchEvent(new CustomEvent('adminConfigChanged', { 
        detail: { products: updatedProducts, type: 'products' } 
      }));
    }, 50);

    console.log('✅ Sincronización de configuración de pagos completada');
  };

  const updateProductPayment = (productId, paymentType, transferFeePercentage = 5) => {
    const updatedProducts = localProducts.map(product => {
      if (product._id === productId) {
        return {
          ...product,
          paymentType,
          transferFeePercentage: parseFloat(transferFeePercentage)
        };
      }
      return product;
    });

    performCompleteSync(updatedProducts);
    setHasUnsavedChanges(true);
    
    const product = localProducts.find(p => p._id === productId);
    toastHandler(ToastType.Success, 
      `✅ ${product.name}: Método de pago actualizado`
    );
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('paymentConfigUpdated', { 
        detail: { products: updatedProducts } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'paymentconfig', data: updatedProducts } 
      }));
    }, 10);
  };

  const updateAllProducts = (paymentType, transferFeePercentage = 5) => {
    const updatedProducts = localProducts.map(product => ({
      ...product,
      paymentType,
      transferFeePercentage: parseFloat(transferFeePercentage)
    }));

    performCompleteSync(updatedProducts);
    setHasUnsavedChanges(true);
    
    toastHandler(ToastType.Success, 
      `✅ Método de pago actualizado para todos los productos`
    );
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('paymentConfigUpdated', { 
        detail: { products: updatedProducts } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'paymentconfig', data: updatedProducts } 
      }));
    }, 10);
  };

  // Filtrar productos
  const filteredProducts = localProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const productPaymentType = product.paymentType || 'both';
    const matchesFilter = filterPaymentType === 'all' || productPaymentType === filterPaymentType;
    
    return matchesSearch && matchesFilter;
  });

  // Estadísticas
  const stats = {
    total: localProducts.length,
    cash: localProducts.filter(p => (p.paymentType || 'both') === 'cash').length,
    transfer: localProducts.filter(p => (p.paymentType || 'both') === 'transfer').length,
    both: localProducts.filter(p => (p.paymentType || 'both') === 'both').length
  };

  const hasChanges = localProducts.length !== productsFromContext.length || 
    JSON.stringify(localProducts) !== JSON.stringify(productsFromContext);

  return (
    <div className={styles.paymentConfigManager}>
      <div className={styles.header}>
        <h2>💳 Configuración de Métodos de Pago</h2>
        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.changesIndicator}>
              🟢 Cambios aplicados en tiempo real
            </span>
          )}
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Sistema de Métodos de Pago</h4>
        <p>Configura qué métodos de pago acepta cada producto. Los productos con transferencia bancaria incluyen un recargo configurable. Los cambios se aplican automáticamente en la tienda y en el checkout.</p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>📊 Estado Actual de Métodos de Pago</h4>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.total}</span>
              <span className={styles.statLabel}>Total Productos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.cash}</span>
              <span className={styles.statLabel}>Solo Efectivo</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.transfer}</span>
              <span className={styles.statLabel}>Solo Transferencia</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.both}</span>
              <span className={styles.statLabel}>Ambos Métodos</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES MASIVOS */}
      <div className={styles.bulkActions}>
        <h4>⚡ Configuración Masiva</h4>
        <div className={styles.bulkControls}>
          <div className={styles.bulkRow}>
            <button 
              onClick={() => updateAllProducts('cash')}
              className="btn btn-success"
            >
              💰 Solo Efectivo para Todos
            </button>
            <button 
              onClick={() => updateAllProducts('transfer', 5)}
              className="btn btn-activated"
            >
              💳 Solo Transferencia para Todos (5%)
            </button>
            <button 
              onClick={() => updateAllProducts('both', 5)}
              className="btn btn-primary"
            >
              💰💳 Ambos Métodos para Todos (5%)
            </button>
          </div>
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
          <label>Filtrar por método de pago:</label>
          <select
            value={filterPaymentType}
            onChange={(e) => setFilterPaymentType(e.target.value)}
            className="form-select"
          >
            <option value="all">🔍 Todos los métodos</option>
            <option value="cash">💰 Solo Efectivo</option>
            <option value="transfer">💳 Solo Transferencia</option>
            <option value="both">💰💳 Ambos Métodos</option>
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
            {filteredProducts.map(product => {
              const paymentType = product.paymentType || 'both';
              const transferFeePercentage = product.transferFeePercentage || 5;
              const transferPrice = product.price * (1 + transferFeePercentage / 100);

              return (
                <div key={product._id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    <img src={product.image} alt={product.name} />
                    <div className={`${styles.paymentBadge} ${styles[`payment${paymentType}`]}`}>
                      {paymentType === 'cash' ? '💰 EFECTIVO' : 
                       paymentType === 'transfer' ? '💳 TRANSFERENCIA' :
                       '💰💳 AMBOS'}
                    </div>
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h4>{product.name}</h4>
                    <p className={styles.productCategory}>📂 {product.category}</p>
                    <p className={styles.productCompany}>🏢 {product.company}</p>
                    
                    <div className={styles.priceInfo}>
                      <div className={styles.priceRow}>
                        <span>💰 Efectivo:</span>
                        <span className={styles.cashPrice}>{formatPriceWithCode(product.price)}</span>
                      </div>
                      {(paymentType === 'transfer' || paymentType === 'both') && (
                        <div className={styles.priceRow}>
                          <span>💳 Transferencia:</span>
                          <span className={styles.transferPrice}>
                            {formatPriceWithCode(transferPrice)}
                            <small> (+{transferFeePercentage}%)</small>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.productControls}>
                    <div className={styles.paymentTypeControl}>
                      <label>Método de Pago:</label>
                      <select
                        value={paymentType}
                        onChange={(e) => updateProductPayment(product._id, e.target.value, transferFeePercentage)}
                        className="form-select"
                      >
                        <option value="both">💰💳 Ambos</option>
                        <option value="cash">💰 Solo Efectivo</option>
                        <option value="transfer">💳 Solo Transferencia</option>
                      </select>
                    </div>
                    
                    {(paymentType === 'transfer' || paymentType === 'both') && (
                      <div className={styles.feeControl}>
                        <label>Recargo Transferencia (%):</label>
                        <input
                          type="number"
                          value={transferFeePercentage}
                          onChange={(e) => updateProductPayment(product._id, paymentType, e.target.value)}
                          className="form-input"
                          min="0"
                          max="20"
                          step="0.1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h3>ℹ️ Información del Sistema de Pagos</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>💰 Pago en Efectivo:</strong> Sin recargos adicionales, precio normal del producto
          </div>
          <div className={styles.infoItem}>
            <strong>💳 Transferencia Bancaria:</strong> Incluye recargo configurable por producto
          </div>
          <div className={styles.infoItem}>
            <strong>🔒 Restricciones en Checkout:</strong> Las opciones de pago se habilitan/deshabilitan según los productos en el carrito
          </div>
          <div className={styles.infoItem}>
            <strong>⚡ Tiempo Real:</strong> Los cambios se aplican inmediatamente en la tienda y checkout
          </div>
          <div className={styles.infoItem}>
            <strong>💱 Conversión de Moneda:</strong> Los recargos se calculan según la moneda seleccionada por el cliente
          </div>
          <div className={styles.infoItem}>
            <strong>📱 WhatsApp:</strong> El desglose completo se incluye en el mensaje de pedido
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfigManager;