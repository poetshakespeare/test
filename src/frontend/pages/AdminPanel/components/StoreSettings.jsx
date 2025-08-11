import React, { useState, useEffect } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType, COUNTRY_CODES } from '../../../constants/constants';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import styles from './StoreSettings.module.css';

const StoreSettings = () => {
  const { storeConfig, updateStoreInfo, updateZones } = useConfigContext();
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Yero Shop!',
    whatsappNumber: '+53 54690878',
    storeAddressId: 'store-main-address',
  });

  const [zones, setZones] = useState([]);
  const [editingZone, setEditingZone] = useState(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ id: '', name: '', cost: '' });

  // Cargar configuración desde el contexto
  useEffect(() => {
    if (storeConfig.storeInfo) {
      setStoreSettings({
        storeName: storeConfig.storeInfo.storeName || 'Yero Shop!',
        whatsappNumber: storeConfig.storeInfo.whatsappNumber || '+53 54690878',
        storeAddressId: storeConfig.storeInfo.storeAddressId || 'store-main-address',
      });
    }
    setZones(storeConfig.zones || []);
  }, [storeConfig]);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateWhatsAppNumber = (number) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    
    if (!cleanNumber.startsWith('+') || cleanNumber.length < 10) {
      return false;
    }

    const countryCode = COUNTRY_CODES.find(country => 
      cleanNumber.startsWith(country.code)
    );

    return !!countryCode;
  };

  const handleWhatsAppChange = (e) => {
    const number = e.target.value;
    setStoreSettings(prev => ({
      ...prev,
      whatsappNumber: number
    }));

    if (number && !validateWhatsAppNumber(number)) {
      e.target.setCustomValidity('Número de WhatsApp inválido');
    } else {
      e.target.setCustomValidity('');
    }
  };

  const handleSaveSettings = () => {
    if (!validateWhatsAppNumber(storeSettings.whatsappNumber)) {
      toastHandler(ToastType.Error, 'Número de WhatsApp inválido');
      return;
    }

    updateStoreInfo(storeSettings);
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('storeInfoUpdated', { 
        detail: { storeInfo: storeSettings } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'storeInfo', data: storeSettings } 
      }));
    }, 10);
  };

  const handleZoneSubmit = (e) => {
    e.preventDefault();
    
    if (!zoneForm.name.trim() || !zoneForm.cost || zoneForm.cost < 0) {
      toastHandler(ToastType.Error, 'Todos los campos son requeridos');
      return;
    }

    const newZone = {
      id: zoneForm.id || zoneForm.name.toLowerCase().replace(/\s+/g, '_'),
      name: zoneForm.name.trim(),
      cost: parseFloat(zoneForm.cost)
    };

    let updatedZones;
    if (editingZone) {
      updatedZones = zones.map(zone => 
        zone.id === editingZone.id ? newZone : zone
      );
      toastHandler(ToastType.Success, 'Zona actualizada exitosamente');
    } else {
      updatedZones = [...zones, newZone];
      toastHandler(ToastType.Success, 'Zona creada exitosamente');
    }

    updateZones(updatedZones);
    setZones(updatedZones);
    
    // Disparar eventos de sincronización
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('zonesUpdated', { 
        detail: { zones: updatedZones } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'zones', data: updatedZones } 
      }));
    }, 10);
    
    resetZoneForm();
  };

  const resetZoneForm = () => {
    setZoneForm({ id: '', name: '', cost: '' });
    setEditingZone(null);
    setShowZoneForm(false);
  };

  const editZone = (zone) => {
    setZoneForm({
      id: zone.id,
      name: zone.name,
      cost: zone.cost.toString()
    });
    setEditingZone(zone);
    setShowZoneForm(true);
  };

  const deleteZone = (zoneId) => {
    if (window.confirm('¿Estás seguro de eliminar esta zona?')) {
      const updatedZones = zones.filter(zone => zone.id !== zoneId);
      updateZones(updatedZones);
      setZones(updatedZones);
      
      // Disparar eventos de sincronización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zonesUpdated', { 
          detail: { zones: updatedZones } 
        }));
        window.dispatchEvent(new CustomEvent('adminPanelSync', { 
          detail: { type: 'zones', data: updatedZones } 
        }));
      }, 10);
      
      toastHandler(ToastType.Success, 'Zona eliminada exitosamente');
    }
  };

  const getCountryInfo = (number) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    const country = COUNTRY_CODES.find(country => 
      cleanNumber.startsWith(country.code)
    );
    return country;
  };

  const countryInfo = getCountryInfo(storeSettings.whatsappNumber);

  return (
    <div className={styles.storeSettings}>
      <h2>Configuración de la Tienda</h2>

      <div className={styles.settingsSection}>
        <h3>Información General</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Nombre de la Tienda</label>
            <input
              type="text"
              name="storeName"
              value={storeSettings.storeName}
              onChange={handleSettingsChange}
              className="form-input"
            />
          </div>

          <div className={styles.formGroup}>
            <label>ID de Dirección de la Tienda</label>
            <input
              type="text"
              name="storeAddressId"
              value={storeSettings.storeAddressId}
              onChange={handleSettingsChange}
              className="form-input"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Número de WhatsApp</label>
          <div className={styles.whatsappContainer}>
            <input
              type="tel"
              name="whatsappNumber"
              value={storeSettings.whatsappNumber}
              onChange={handleWhatsAppChange}
              className={`form-input ${styles.whatsappInput}`}
              placeholder="+53 54690878"
            />
            {countryInfo && (
              <div className={styles.countryInfo}>
                <span className={styles.flag}>{countryInfo.flag}</span>
                <span className={styles.countryName}>{countryInfo.country}</span>
              </div>
            )}
          </div>
          {!validateWhatsAppNumber(storeSettings.whatsappNumber) && storeSettings.whatsappNumber && (
            <p className={styles.errorText}>Número de WhatsApp inválido</p>
          )}
        </div>

        <button onClick={handleSaveSettings} className="btn btn-primary">
          Guardar Configuración
        </button>
      </div>

      <div className={styles.settingsSection}>
        <div className={styles.sectionHeader}>
          <h3>Zonas de Entrega</h3>
          <button 
            className="btn btn-primary"
            onClick={() => setShowZoneForm(!showZoneForm)}
          >
            {showZoneForm ? 'Cancelar' : '+ Nueva Zona'}
          </button>
        </div>

        {showZoneForm && (
          <form className={styles.zoneForm} onSubmit={handleZoneSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre de la Zona *</label>
                <input
                  type="text"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Costo de Entrega (CUP) *</label>
                <input
                  type="number"
                  value={zoneForm.cost}
                  onChange={(e) => setZoneForm(prev => ({ ...prev, cost: e.target.value }))}
                  className="form-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary">
                {editingZone ? 'Actualizar Zona' : 'Crear Zona'}
              </button>
              <button type="button" onClick={resetZoneForm} className="btn btn-hipster">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className={styles.zonesList}>
          {zones.map(zone => (
            <div key={zone.id} className={styles.zoneCard}>
              <div className={styles.zoneInfo}>
                <h4>{zone.name}</h4>
                <p>Costo: ${zone.cost} CUP</p>
              </div>
              <div className={styles.zoneActions}>
                <button
                  onClick={() => editZone(zone)}
                  className="btn btn-primary"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteZone(zone.id)}
                  className="btn btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;