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

const AdminPanel = () => {
  const { isAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState('products');

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  const tabs = [
    { id: 'products', label: '📦 Productos', component: ProductManager },
    { id: 'categories', label: '📂 Categorías', component: CategoryManager },
    { id: 'coupon-products', label: '🎫 Control Cupones', component: CouponProductManager },
    { id: 'messages', label: '💬 Mensajes', component: MessagesManager },
    { id: 'coupons', label: '🏷️ Cupones', component: CouponManager },
    { id: 'settings', label: '⚙️ Configuración', component: StoreSettings },
    { id: 'config', label: '💾 Exportar/Importar', component: ConfigManager },
    { id: 'backup', label: '🗂️ Sistema Backup', component: BackupManager },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className={styles.adminPanel}>
      <div className={styles.tabContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
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