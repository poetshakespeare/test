import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContextProvider';
import { Navigate } from 'react-router-dom';
import ProductManager from './components/ProductManager';
import CouponManager from './components/CouponManager';
import StoreSettings from './components/StoreSettings';
import ConfigManager from './components/ConfigManager';
import CategoryManager from './components/CategoryManager';
import MessagesManager from './components/MessagesManager';
import BackupManager from './components/BackupManager';
import CouponProductManager from './components/CouponProductManager';
import styles from './AdminPanel.module.css';

import PaymentConfigManager from './components/PaymentConfigManager';

const AdminPanel = () => {
  const { isAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState('products');
  const [syncStatus, setSyncStatus] = useState({});

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  // ESCUCHAR EVENTOS DE SINCRONIZACIÓN GLOBAL
  React.useEffect(() => {
    const handleAdminPanelSync = (event) => {
      const { type, data } = event.detail;
      console.log(`🔄 Sincronización global detectada en AdminPanel: ${type}`);
      
      setSyncStatus(prev => ({
        ...prev,
        [type]: {
          lastSync: new Date().toISOString(),
          dataLength: Array.isArray(data) ? data.length : Object.keys(data || {}).length
        }
      }));
      
      // Mostrar indicador visual temporal
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            showIndicator: true
          }
        }));
      }, 100);
      
      // Ocultar indicador después de 3 segundos
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            showIndicator: false
          }
        }));
      }, 3000);
    };

    window.addEventListener('adminPanelSync', handleAdminPanelSync);

    return () => {
      window.removeEventListener('adminPanelSync', handleAdminPanelSync);
    };
  }, []);
  const tabs = [
    { id: 'products', label: '📦 Productos', component: ProductManager },
    { id: 'categories', label: '📂 Categorías', component: CategoryManager },
    { id: 'payment-config', label: '💳 Métodos de Pago', component: PaymentConfigManager },
    { id: 'coupon-products', label: '🎫 Control Cupones', component: CouponProductManager },
    { id: 'messages', label: '💬 Mensajes', component: MessagesManager },
    { id: 'coupons', label: '🏷️ Cupones', component: CouponManager },
    { id: 'settings', label: '⚙️ Configuración', component: StoreSettings },
    { id: 'config', label: '💾 Exportar/Importar', component: ConfigManager },
    { id: 'backup', label: '🗂️ Sistema Backup', component: BackupManager },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  // Función para obtener el indicador de sincronización
  const getSyncIndicator = (tabId) => {
    const status = syncStatus[tabId];
    if (status?.showIndicator) {
      return <span className={styles.syncIndicator}>🟢</span>;
    }
    return null;
  };
  return (
    <div className={styles.adminPanel}>
      {/* INDICADOR DE SINCRONIZACIÓN GLOBAL */}
      {Object.keys(syncStatus).some(key => syncStatus[key]?.showIndicator) && (
        <div className={styles.globalSyncIndicator}>
          <span>🔄 Sincronizando cambios en tiempo real...</span>
        </div>
      )}
      
      <div className={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {getSyncIndicator(tab.id.replace('-', ''))}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AdminPanel;