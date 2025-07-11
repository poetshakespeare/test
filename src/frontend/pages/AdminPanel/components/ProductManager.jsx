import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import styles from './ProductManager.module.css';

const ProductManager = () => {
  const { products, categories, updateProductsFromAdmin } = useAllProductsContext();
  const { updateProducts } = useConfigContext();
  const [localProducts, setLocalProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    category: '',
    company: '',
    stock: '',
    reviewCount: '',
    stars: '',
    colors: [{ color: '#000000', colorQuantity: 0 }],
    image: '',
    isShippingAvailable: true,
    featured: false,
    canUseCoupons: true // NUEVA PROPIEDAD PARA CUPONES
  });

  // Cargar productos desde el contexto
  useEffect(() => {
    setLocalProducts(products || []);
  }, [products]);

  // FUNCIÓN PARA MANTENER EL TAMAÑO ACTUAL DE LAS IMÁGENES (RESPONSIVO)
  const resizeImageToCurrentSize = (file, callback) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // MANTENER EL TAMAÑO ACTUAL DE LOS PRODUCTOS EXISTENTES
      // Analizando las imágenes actuales, mantienen proporción 4:3 responsiva
      const targetWidth = 600;  // Tamaño actual de los productos
      const targetHeight = 450; // Proporción 4:3 como las actuales
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Calcular dimensiones manteniendo proporción
      const aspectRatio = img.width / img.height;
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (aspectRatio > targetWidth/targetHeight) {
        drawHeight = targetWidth / aspectRatio;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        drawWidth = targetHeight * aspectRatio;
        offsetX = (targetWidth - drawWidth) / 2;
      }
      
      // Fondo blanco para mejor contraste (como las actuales)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Dibujar imagen centrada y redimensionada
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Convertir a base64 con buena calidad (como las actuales)
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(resizedDataUrl);
    };
    
    img.onerror = () => {
      toastHandler(ToastType.Error, 'Error al procesar la imagen');
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setHasUnsavedChanges(true);
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...formData.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setFormData(prev => ({ ...prev, colors: newColors }));
    setHasUnsavedChanges(true);
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { color: '#000000', colorQuantity: 0 }]
    }));
    setHasUnsavedChanges(true);
  };

  const removeColor = (index) => {
    if (formData.colors.length > 1) {
      const newColors = formData.colors.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, colors: newColors }));
      setHasUnsavedChanges(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toastHandler(ToastType.Error, 'Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toastHandler(ToastType.Error, 'La imagen debe ser menor a 10MB');
        return;
      }
      
      // Redimensionar imagen manteniendo el tamaño actual
      resizeImageToCurrentSize(file, (resizedDataUrl) => {
        setFormData(prev => ({ ...prev, image: resizedDataUrl }));
        setHasUnsavedChanges(true);
        toastHandler(ToastType.Success, 'Imagen optimizada manteniendo el tamaño actual de los productos');
      });
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      description: product.description,
      category: product.category,
      company: product.company,
      stock: product.stock.toString(),
      reviewCount: product.reviewCount.toString(),
      stars: product.stars.toString(),
      colors: product.colors,
      image: product.image,
      isShippingAvailable: product.isShippingAvailable,
      featured: product.featured || false,
      canUseCoupons: product.canUseCoupons !== undefined ? product.canUseCoupons : true // CARGAR CONFIGURACIÓN DE CUPONES
    });
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    // Validaciones
    if (!formData.name.trim()) {
      toastHandler(ToastType.Error, 'El nombre del producto es requerido');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toastHandler(ToastType.Error, 'El precio debe ser mayor a 0');
      return;
    }

    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
      toastHandler(ToastType.Error, 'El precio original debe ser mayor a 0');
      return;
    }

    if (!formData.category) {
      toastHandler(ToastType.Error, 'Selecciona una categoría');
      return;
    }

    if (!formData.company.trim()) {
      toastHandler(ToastType.Error, 'La marca es requerida');
      return;
    }

    if (!formData.image.trim()) {
      toastHandler(ToastType.Error, 'La imagen del producto es requerida');
      return;
    }

    // Validar colores
    const hasValidColors = formData.colors.every(color => 
      color.color && color.colorQuantity >= 0
    );

    if (!hasValidColors) {
      toastHandler(ToastType.Error, 'Todos los colores deben tener una cantidad válida');
      return;
    }

    // Calcular stock total basado en los colores
    const totalStock = formData.colors.reduce((total, color) => total + parseInt(color.colorQuantity || 0), 0);

    // Crear producto con estructura exacta de products.js INCLUYENDO CUPONES
    const newProduct = {
      "_id": selectedProduct ? selectedProduct._id : uuid(),
      "name": formData.name.trim(),
      "price": parseFloat(formData.price),
      "originalPrice": parseFloat(formData.originalPrice),
      "description": formData.description.trim(),
      "category": formData.category,
      "company": formData.company.trim(),
      "stock": totalStock,
      "reviewCount": parseInt(formData.reviewCount) || 0,
      "stars": parseFloat(formData.stars) || 0,
      "colors": formData.colors.map(color => ({
        "color": color.color,
        "colorQuantity": parseInt(color.colorQuantity) || 0
      })),
      "image": formData.image,
      "isShippingAvailable": formData.isShippingAvailable,
      "featured": formData.featured,
      "canUseCoupons": formData.canUseCoupons, // NUEVA PROPIEDAD
      "id": selectedProduct ? selectedProduct.id : (localProducts.length + 1).toString()
    };

    let updatedProducts;
    if (selectedProduct) {
      updatedProducts = localProducts.map(p => p._id === selectedProduct._id ? newProduct : p);
      toastHandler(ToastType.Success, '✅ Producto actualizado exitosamente');
    } else {
      updatedProducts = [...localProducts, newProduct];
      toastHandler(ToastType.Success, '✅ Producto creado exitosamente');
    }

    // SINCRONIZACIÓN COMPLETA Y INMEDIATA MEJORADA
    performCompleteSync(updatedProducts);
    
    resetForm();
  };

  // Función para sincronización completa MEJORADA CON EVENTOS ADICIONALES
  const performCompleteSync = (updatedProducts) => {
    console.log('🔄 Iniciando sincronización completa de productos...');
    
    // 1. Actualizar estado local inmediatamente
    setLocalProducts(updatedProducts);
    
    // 2. Actualizar en localStorage para persistencia inmediata
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
            console.log('✅ Sincronización de productos verificada exitosamente');
            toastHandler(ToastType.Info, '🔄 Productos sincronizados en tiempo real');
            
            // NUEVO: Notificación específica para cambios de envío
            const shippingEnabledProducts = updatedProducts.filter(p => p.isShippingAvailable);
            if (shippingEnabledProducts.length > 0) {
              toastHandler(ToastType.Success, `🚚 ${shippingEnabledProducts.length} productos con envío disponible actualizados`);
            }
          }
        } catch (error) {
          console.error('Error en verificación de sincronización:', error);
        }
      }
    }, 200);

    console.log('✅ Sincronización de productos completada');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      originalPrice: '',
      description: '',
      category: '',
      company: '',
      stock: '',
      reviewCount: '',
      stars: '',
      colors: [{ color: '#000000', colorQuantity: 0 }],
      image: '',
      isShippingAvailable: true,
      featured: false,
      canUseCoupons: true // VALOR POR DEFECTO PARA CUPONES
    });
    setSelectedProduct(null);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    resetForm();
  };

  const deleteProduct = (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) {
      return;
    }

    const updatedProducts = localProducts.filter(p => p._id !== productId);
    
    // SINCRONIZACIÓN COMPLETA
    performCompleteSync(updatedProducts);
    
    toastHandler(ToastType.Success, '✅ Producto eliminado exitosamente');
  };

  // Verificar si hay cambios pendientes
  const hasChanges = localProducts.length !== products.length || 
    JSON.stringify(localProducts) !== JSON.stringify(products);

  return (
    <div className={styles.productManager}>
      <div className={styles.header}>
        <h2>📦 Gestión de Productos</h2>
        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.changesIndicator}>
              🟢 Cambios aplicados en tiempo real
            </span>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Información Importante</h4>
        <p>Los cambios se aplican automáticamente en la tienda. Las imágenes mantienen el tamaño actual de los productos existentes (600x450px responsivo). Los productos sin "Envío Disponible" no permiten entrega a domicilio. La configuración de cupones controla si el producto puede usar descuentos. Para exportar los cambios permanentemente, ve a la sección "🗂️ Sistema Backup".</p>
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <div className={styles.formHeader}>
            <h3>{selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            {hasUnsavedChanges && (
              <span className={styles.unsavedIndicator}>
                🔴 Cambios sin guardar
              </span>
            )}
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nombre del Producto *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Precio *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Precio"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Precio Original *</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Precio original"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Categoría *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories.filter(cat => !cat.disabled).map(cat => (
                  <option key={cat._id} value={cat.categoryName}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Marca *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Marca"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Número de Reseñas</label>
              <input
                type="number"
                name="reviewCount"
                value={formData.reviewCount}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Número de reseñas"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Calificación (1-5)</label>
              <input
                type="number"
                name="stars"
                value={formData.stars}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                max="5"
                step="0.1"
                placeholder="Calificación"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Descripción *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Descripción del producto"
              rows="4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Imagen del Producto * (Mantiene el tamaño actual: 600x450px responsivo)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-input"
            />
            <small>O ingresa una URL de imagen:</small>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
            {formData.image && (
              <div className={styles.imagePreview}>
                <img src={formData.image} alt="Preview" />
                <small>Tamaño: 600x450px (igual que los productos actuales)</small>
              </div>
            )}
          </div>

          <div className={styles.colorsSection}>
            <label>Colores y Stock por Color *</label>
            <p className={styles.stockInfo}>
              <strong>Stock Total Calculado:</strong> {formData.colors.reduce((total, color) => total + parseInt(color.colorQuantity || 0), 0)} unidades
            </p>
            {formData.colors.map((color, index) => (
              <div key={index} className={styles.colorRow}>
                <input
                  type="color"
                  value={color.color}
                  onChange={(e) => handleColorChange(index, 'color', e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="number"
                  value={color.colorQuantity}
                  onChange={(e) => handleColorChange(index, 'colorQuantity', parseInt(e.target.value) || 0)}
                  className="form-input"
                  placeholder="Cantidad"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="btn btn-danger"
                  disabled={formData.colors.length === 1}
                >
                  ❌
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addColor}
              className="btn btn-hipster"
            >
              ➕ Agregar Color
            </button>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isShippingAvailable"
                checked={formData.isShippingAvailable}
                onChange={handleInputChange}
              />
              🚚 Envío Disponible (Permite entrega a domicilio)
              <small className={styles.shippingNote}>
                ⚡ Los cambios se aplican inmediatamente en el checkout
              </small>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="canUseCoupons"
                checked={formData.canUseCoupons}
                onChange={handleInputChange}
              />
              🎫 Puede Usar Cupones de Descuento
              <small className={styles.couponNote}>
                ⚡ Los cupones solo se aplicarán si TODOS los productos del carrito tienen esta opción habilitada
              </small>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
              />
              ⭐ Producto Destacado
            </label>
          </div>

          <div className={styles.formActions}>
            <button onClick={handleSave} className="btn btn-primary">
              💾 {selectedProduct ? 'Actualizar' : 'Crear'} Producto
            </button>
            <button onClick={handleCancel} className="btn btn-danger">
              ❌ Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.productList}>
          <div className={styles.listHeader}>
            <h3>Productos Existentes ({localProducts.length})</h3>
            {hasChanges && (
              <div className={styles.changesAlert}>
                <span>🟢 Los cambios se han aplicado en tiempo real en la tienda</span>
                <small>Ve a "🗂️ Sistema Backup" para exportar los cambios</small>
              </div>
            )}
          </div>

          <div className={styles.productGrid}>
            {localProducts.map(product => (
              <div key={product._id} className={styles.productCard}>
                <div className={styles.productImage}>
                  <img src={product.image} alt={product.name} />
                </div>
                <div className={styles.productInfo}>
                  <h4>{product.name}</h4>
                  <p className={styles.productPrice}>${product.price.toLocaleString()} CUP</p>
                  <p className={styles.productStock}>Stock: {product.stock}</p>
                  <p className={styles.productRating}>⭐ {product.stars} ({product.reviewCount})</p>
                  <p className={styles.productCategory}>📂 {product.category}</p>
                  <p className={styles.productCompany}>🏢 {product.company}</p>
                  <p className={`${styles.productShipping} ${product.isShippingAvailable ? styles.shippingEnabled : styles.shippingDisabled}`}>
                    🚚 {product.isShippingAvailable ? 'Envío disponible' : 'Sin envío (Solo recogida)'}
                  </p>
                  <p className={`${styles.productCoupons} ${product.canUseCoupons !== false ? styles.couponsEnabled : styles.couponsDisabled}`}>
                    🎫 {product.canUseCoupons !== false ? 'Puede usar cupones' : 'Sin cupones de descuento'}
                  </p>
                  {product.featured && <span className={styles.featuredBadge}>⭐ Destacado</span>}
                </div>
                <div className={styles.productActions}>
                  <button
                    onClick={() => handleEdit(product)}
                    className="btn btn-primary"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="btn btn-danger"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;