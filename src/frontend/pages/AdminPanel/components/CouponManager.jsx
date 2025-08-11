import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import styles from './CouponManager.module.css';

const CouponManager = () => {
  const { storeConfig, updateCoupons } = useConfigContext();
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const initialCouponState = {
    couponCode: '',
    text: '',
    discountPercent: '',
    minCartPriceRequired: ''
  };

  const [couponForm, setCouponForm] = useState(initialCouponState);

  // Cargar cupones desde la configuración
  useEffect(() => {
    setCoupons(storeConfig.coupons || []);
  }, [storeConfig.coupons]);

  // ESCUCHAR EVENTOS DE SINCRONIZACIÓN
  useEffect(() => {
    const handleCouponsUpdate = (event) => {
      const { coupons: updatedCoupons } = event.detail;
      console.log('📡 Evento de actualización de cupones recibido en CouponManager');
      setCoupons(updatedCoupons);
    };

    const handleAdminPanelSync = (event) => {
      const { type, data } = event.detail;
      if (type === 'coupons') {
        console.log('📡 Sincronización de panel admin para cupones');
        setCoupons(data);
      }
    };

    window.addEventListener('couponsUpdated', handleCouponsUpdate);
    window.addEventListener('adminPanelSync', handleAdminPanelSync);

    return () => {
      window.removeEventListener('couponsUpdated', handleCouponsUpdate);
      window.removeEventListener('adminPanelSync', handleAdminPanelSync);
    };
  }, []);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCouponForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!couponForm.couponCode.trim()) {
      toastHandler(ToastType.Error, 'El código del cupón es requerido');
      return;
    }
    
    if (!couponForm.discountPercent || couponForm.discountPercent <= 0 || couponForm.discountPercent > 100) {
      toastHandler(ToastType.Error, 'El descuento debe ser entre 1 y 100%');
      return;
    }

    if (!couponForm.minCartPriceRequired || couponForm.minCartPriceRequired < 0) {
      toastHandler(ToastType.Error, 'El precio mínimo debe ser mayor o igual a 0');
      return;
    }

    // Verificar código duplicado
    const isDuplicate = coupons.some(coupon => 
      coupon.couponCode.toUpperCase() === couponForm.couponCode.toUpperCase() && 
      coupon.id !== editingCoupon?.id
    );

    if (isDuplicate) {
      toastHandler(ToastType.Error, 'Ya existe un cupón con este código');
      return;
    }

    const newCoupon = {
      ...couponForm,
      id: editingCoupon ? editingCoupon.id : uuid(),
      couponCode: couponForm.couponCode.toUpperCase(),
      text: couponForm.text || `${couponForm.discountPercent}% Descuento`,
      discountPercent: parseInt(couponForm.discountPercent),
      minCartPriceRequired: parseFloat(couponForm.minCartPriceRequired)
    };

    let updatedCoupons;
    if (editingCoupon) {
      updatedCoupons = coupons.map(c => c.id === editingCoupon.id ? newCoupon : c);
      toastHandler(ToastType.Success, 'Cupón actualizado exitosamente');
    } else {
      updatedCoupons = [...coupons, newCoupon];
      toastHandler(ToastType.Success, 'Cupón creado exitosamente');
    }

    // Actualizar en el contexto de configuración
    updateCoupons(updatedCoupons);
    setCoupons(updatedCoupons);
    
    // Disparar eventos de sincronización adicionales
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('couponsUpdated', { 
        detail: { coupons: updatedCoupons } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'coupons', data: updatedCoupons } 
      }));
    }, 10);
    
    resetForm();
  };

  const resetForm = () => {
    setCouponForm(initialCouponState);
    setEditingCoupon(null);
    setShowForm(false);
  };

  const editCoupon = (coupon) => {
    setCouponForm({
      couponCode: coupon.couponCode,
      text: coupon.text,
      discountPercent: coupon.discountPercent.toString(),
      minCartPriceRequired: coupon.minCartPriceRequired.toString()
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const deleteCoupon = (couponId) => {
    if (window.confirm('¿Estás seguro de eliminar este cupón?')) {
      const updatedCoupons = coupons.filter(c => c.id !== couponId);
      updateCoupons(updatedCoupons);
      setCoupons(updatedCoupons);
      
      // Disparar eventos de sincronización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('couponsUpdated', { 
          detail: { coupons: updatedCoupons } 
        }));
        window.dispatchEvent(new CustomEvent('adminPanelSync', { 
          detail: { type: 'coupons', data: updatedCoupons } 
        }));
      }, 10);
      
      toastHandler(ToastType.Success, 'Cupón eliminado exitosamente');
    }
  };

  return (
    <div className={styles.couponManager}>
      <div className={styles.header}>
        <h2>Gestión de Cupones</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Cupón'}
        </button>
      </div>

      {showForm && (
        <form className={styles.couponForm} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Código del Cupón *</label>
              <input
                type="text"
                name="couponCode"
                value={couponForm.couponCode}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ej: DESCUENTO20"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Porcentaje de Descuento * (%)</label>
              <input
                type="number"
                name="discountPercent"
                value={couponForm.discountPercent}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                max="100"
                placeholder="Ej: 20"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Precio Mínimo Requerido * (CUP)</label>
              <input
                type="number"
                name="minCartPriceRequired"
                value={couponForm.minCartPriceRequired}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                step="0.01"
                placeholder="Ej: 50000"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Texto Descriptivo</label>
              <input
                type="text"
                name="text"
                value={couponForm.text}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ej: 20% Descuento"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              {editingCoupon ? 'Actualizar Cupón' : 'Crear Cupón'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-hipster">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.couponsList}>
        <h3>Cupones Existentes ({coupons.length})</h3>
        {coupons.length === 0 ? (
          <p className={styles.emptyMessage}>No hay cupones creados aún.</p>
        ) : (
          <div className={styles.couponsGrid}>
            {coupons.map(coupon => (
              <div key={coupon.id} className={styles.couponCard}>
                <div className={styles.couponHeader}>
                  <h4>{coupon.couponCode}</h4>
                  <span className={styles.discountBadge}>
                    {coupon.discountPercent}% OFF
                  </span>
                </div>
                <div className={styles.couponInfo}>
                  <p><strong>Descripción:</strong> {coupon.text}</p>
                  <p><strong>Descuento:</strong> {coupon.discountPercent}%</p>
                  <p><strong>Compra mínima:</strong> ${coupon.minCartPriceRequired.toLocaleString()} CUP</p>
                </div>
                <div className={styles.couponActions}>
                  <button
                    onClick={() => editCoupon(coupon)}
                    className="btn btn-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteCoupon(coupon.id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponManager;