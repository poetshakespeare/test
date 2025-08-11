import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { toastHandler } from '../../../utils/utils';
import { ToastType, PAYMENT_TYPES, TRANSFER_CONFIG } from '../../../constants/constants';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import { useCurrencyContext } from '../../../contexts/CurrencyContextProvider';
import styles from './ProductManager.module.css';

const ProductManager = () => {
  const { products: productsFromContext, categories: categoriesFromContext, updateProductsFromAdmin } = useAllProductsContext();
  const { updateProducts } = useConfigContext();
  const { formatPriceWithCode } = useCurrencyContext();
  const [localProducts, setLocalProducts] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const initialProductState = {
    name: '',
    price: '',
    originalPrice: '',
    image: '',
    category: '',
    company: '',
    description: '',
    stars: '',
    reviewCount: '',
    featured: false,
    isShippingAvailable: true,
    canUseCoupons: true,
    paymentType: 'both',
    transferFeePercentage: 5,
    colors: [{ color: '#000000', colorQuantity: 1 }]
  };

  const [productForm, setProductForm] = useState(initialProductState);

  // CARGAR PRODUCTOS CON SINCRONIZACIÓN MEJORADA
  useEffect(() => {
    console.log('🔄 Cargando productos en ProductManager:', productsFromContext?.length || 0);
    
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
            console.log('📦 Cargando productos desde localStorage:', parsedConfig.products.length);
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

  // CARGAR CATEGORÍAS PARA SINCRONIZACIÓN
  useEffect(() => {
    console.log('🔄 Cargando categorías en ProductManager:', categoriesFromContext?.length || 0);
    
    if (categoriesFromContext && categoriesFromContext.length > 0) {
      setLocalCategories(categoriesFromContext);
    } else {
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.categories && parsedConfig.categories.length > 0) {
            console.log('📂 Cargando categorías desde localStorage para productos:', parsedConfig.categories.length);
            setLocalCategories(parsedConfig.categories);
          }
        } catch (error) {
          console.error('Error al cargar categorías desde localStorage:', error);
        }
      }
    }
  }, [categoriesFromContext]);
  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN DE PRODUCTOS
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      const { products: updatedProducts } = event.detail;
      console.log('📡 Evento de actualización de productos recibido en ProductManager');
      setLocalProducts(updatedProducts);
    };

    const handleCategoriesUpdate = (event) => {
      const { categories: updatedCategories } = event.detail;
      console.log('📡 Evento de actualización de categorías recibido en ProductManager');
      setLocalCategories(updatedCategories);
    };
    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración recibido en ProductManager');
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products) {
            setLocalProducts(parsedConfig.products);
          }
          if (parsedConfig.categories) {
            setLocalCategories(parsedConfig.categories);
          }
        } catch (error) {
          console.error('Error al cargar productos desde configuración:', error);
        }
      }
    };

    // Agregar listeners
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('productsConfigUpdated', handleProductsUpdate);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('categoriesConfigUpdated', handleCategoriesUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('productsConfigUpdated', handleProductsUpdate);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('categoriesConfigUpdated', handleCategoriesUpdate);
      window.removeEventListener('forceStoreUpdate', handleConfigUpdate);
      window.removeEventListener('adminConfigChanged', handleConfigUpdate);
    };
  }, []);

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
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setHasUnsavedChanges(true);
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
        setProductForm(prev => ({ ...prev, image: resizedDataUrl }));
        setHasUnsavedChanges(true);
        toastHandler(ToastType.Success, 'Imagen optimizada manteniendo el tamaño actual de los productos');
      });
    }
  };

  const handleColorChange = (index, field, value) => {
    const updatedColors = [...productForm.colors];
    updatedColors[index] = { ...updatedColors[index], [field]: value };
    setProductForm(prev => ({ ...prev, colors: updatedColors }));
    setHasUnsavedChanges(true);
  };

  const addColor = () => {
    setProductForm(prev => ({
      ...prev,
      colors: [...prev.colors, { color: '#000000', colorQuantity: 1 }]
    }));
    setHasUnsavedChanges(true);
  };

  const removeColor = (index) => {
    if (productForm.colors.length > 1) {
      const updatedColors = productForm.colors.filter((_, i) => i !== index);
      setProductForm(prev => ({ ...prev, colors: updatedColors }));
      setHasUnsavedChanges(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!productForm.name.trim()) {
      toastHandler(ToastType.Error, 'El nombre del producto es requerido');
      return;
    }
    
    if (!productForm.price || productForm.price <= 0) {
      toastHandler(ToastType.Error, 'El precio debe ser mayor a 0');
      return;
    }

    if (!productForm.image.trim()) {
      toastHandler(ToastType.Error, 'La imagen del producto es requerida');
      return;
    }

    // Crear producto con estructura exacta de products.js
    const newProduct = {
      "_id": editingProduct ? editingProduct._id : uuid(),
      "name": productForm.name.trim(),
      "price": parseFloat(productForm.price),
      "originalPrice": parseFloat(productForm.originalPrice) || parseFloat(productForm.price),
      "image": productForm.image,
      "category": productForm.category.toLowerCase().trim(),
      "company": productForm.company.trim(),
      "description": productForm.description.trim(),
      "stock": productForm.colors.reduce((total, color) => total + (parseInt(color.colorQuantity) || 0), 0),
      "stars": parseFloat(productForm.stars) || 4.5,
      "reviewCount": parseInt(productForm.reviewCount) || 0,
      "featured": productForm.featured,
      "isShippingAvailable": productForm.isShippingAvailable,
      "canUseCoupons": productForm.canUseCoupons,
      "paymentType": productForm.paymentType,
      "transferFeePercentage": parseFloat(productForm.transferFeePercentage) || 5,
      "colors": productForm.colors.map(color => ({
        "color": color.color,
        "colorQuantity": parseInt(color.colorQuantity) || 1
      }))
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = localProducts.map(p => p._id === editingProduct._id ? newProduct : p);
      toastHandler(ToastType.Success, '✅ Producto actualizado exitosamente');
    } else {
      updatedProducts = [...localProducts, newProduct];
      toastHandler(ToastType.Success, '✅ Producto creado exitosamente');
    }

    // SINCRONIZACIÓN COMPLETA Y INMEDIATA MEJORADA
    performCompleteSync(updatedProducts);
    
    resetForm();
  };

  // Función para sincronización completa MEJORADA CON PERSISTENCIA GARANTIZADA
  const performCompleteSync = (updatedProducts) => {
    console.log('🔄 Iniciando sincronización completa de productos...');
    
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
          console.log('✅ Productos guardados correctamente en localStorage');
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
            console.log('✅ Sincronización de productos verificada exitosamente');
            toastHandler(ToastType.Info, '🔄 Productos sincronizados en tiempo real');
          }
        } catch (error) {
          console.error('Error en verificación de sincronización:', error);
        }
      }
    }, 200);

    console.log('✅ Sincronización de productos completada');
  };

  const resetForm = () => {
    setProductForm(initialProductState);
    setEditingProduct(null);
    setHasUnsavedChanges(false);
  };

  const editProduct = (product) => {
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      image: product.image,
      category: product.category,
      company: product.company,
      description: product.description,
      stars: product.stars.toString(),
      reviewCount: product.reviewCount.toString(),
      featured: product.featured,
      isShippingAvailable: product.isShippingAvailable,
      canUseCoupons: product.canUseCoupons,
      paymentType: product.paymentType || 'both',
      transferFeePercentage: product.transferFeePercentage || 5,
      colors: product.colors || [{ color: '#000000', colorQuantity: 1 }]
    });
    setEditingProduct(product);
    setHasUnsavedChanges(false);
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

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    resetForm();
  };

  // Calcular precio con transferencia
  const calculateTransferPrice = () => {
    if (!productForm.price) return 0;
    const basePrice = parseFloat(productForm.price);
    const feePercentage = parseFloat(productForm.transferFeePercentage) || 5;
    return basePrice * (1 + feePercentage / 100);
  };
  // Obtener categorías disponibles para el selector
  const getAvailableCategories = () => {
    const enabledCategories = localCategories.filter(cat => !cat.disabled);
    return enabledCategories.map(cat => cat.categoryName);
  };

  const availableCategories = getAvailableCategories();

  // Verificar si hay cambios pendientes
  const hasChanges = localProducts.length !== productsFromContext.length || 
    JSON.stringify(localProducts) !== JSON.stringify(productsFromContext);

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
            onClick={() => setEditingProduct({})}
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Información Importante</h4>
        <p>Los cambios se aplican automáticamente en la tienda. Las imágenes mantienen el tamaño actual de los productos existentes (600x450px responsivo). El stock total se calcula automáticamente sumando el stock de todos los colores. Las categorías se sincronizan con las categorías existentes. Para exportar los cambios permanentemente, ve a la sección "🗂️ Sistema Backup".</p>
      </div>

      {editingProduct && (
        <form className={styles.editForm} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3>{editingProduct._id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
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
                value={productForm.name}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Precio (CUP) *</label>
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Precio Original (CUP)</label>
              <input
                type="number"
                name="originalPrice"
                value={productForm.originalPrice}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Categoría * (Sincronizada con categorías existentes)</label>
              {availableCategories.length > 0 ? (
                <select
                  name="category"
                  value={productForm.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {availableCategories.map(categoryName => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={styles.noCategoriesWarning}>
                  <p>⚠️ No hay categorías disponibles</p>
                  <small>Ve a la sección "📂 Categorías" para crear categorías primero</small>
                  <input
                    type="text"
                    name="category"
                    value={productForm.category}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Escribe una categoría temporal"
                    required
                  />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Marca/Compañía *</label>
              <input
                type="text"
                name="company"
                value={productForm.company}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>


            <div className={styles.formGroup}>
              <label>Calificación (1-5)</label>
              <input
                type="number"
                name="stars"
                value={productForm.stars}
                onChange={handleInputChange}
                className="form-input"
                min="1"
                max="5"
                step="0.1"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Número de Reseñas</label>
              <input
                type="number"
                name="reviewCount"
                value={productForm.reviewCount}
                onChange={handleInputChange}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Descripción</label>
            <textarea
              name="description"
              value={productForm.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
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
              value={productForm.image}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
            {productForm.image && (
              <div className={styles.imagePreview}>
                <img src={productForm.image} alt="Preview" />
                <small>Tamaño: 600x450px (igual que los productos actuales)</small>
              </div>
            )}
          </div>

          {/* SECCIÓN DE COLORES */}
          <div className={styles.colorsSection}>
            <div className={styles.colorsSectionHeader}>
              <label>Colores y Stock por Color *</label>
              <div className={styles.stockInfo}>
                📦 Stock total calculado: {productForm.colors.reduce((total, color) => total + (parseInt(color.colorQuantity) || 0), 0)} unidades
              </div>
            </div>
            {productForm.colors.map((color, index) => (
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
                  onChange={(e) => handleColorChange(index, 'colorQuantity', e.target.value)}
                  className="form-input"
                  placeholder="Cantidad"
                  min="0"
                  style={{ width: '120px' }}
                />
                <span>unidades</span>
                {productForm.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addColor}
              className="btn btn-hipster"
              style={{ marginTop: '0.5rem' }}
            >
              + Agregar Color
            </button>
          </div>

          {/* CONFIGURACIÓN DE CARACTERÍSTICAS */}
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="featured"
                checked={productForm.featured}
                onChange={handleInputChange}
              />
              ⭐ Producto Destacado (aparece en la página principal)
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isShippingAvailable"
                checked={productForm.isShippingAvailable}
                onChange={handleInputChange}
              />
              🚚 Envío Disponible (permite entrega a domicilio)
              <span className={styles.shippingNote}>
                Si está deshabilitado, solo se puede recoger en tienda
              </span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="canUseCoupons"
                checked={productForm.canUseCoupons}
                onChange={handleInputChange}
              />
              🎫 Puede Usar Cupones de Descuento
              <span className={styles.couponNote}>
                Los cupones solo se aplican si TODOS los productos del carrito los permiten
              </span>
            </label>
          </div>

          {/* CONFIGURACIÓN DE MÉTODOS DE PAGO */}
          <div className={styles.paymentSection}>
            <h4>💳 Configuración de Métodos de Pago</h4>
            
            <div className={styles.paymentGrid}>
              <div className={styles.formGroup}>
                <label>Método de Pago Aceptado</label>
                <select
                  name="paymentType"
                  value={productForm.paymentType}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="both">💰💳 Efectivo y Transferencia</option>
                  <option value="cash">💰 Solo Efectivo</option>
                  <option value="transfer">💳 Solo Transferencia</option>
                </select>
              </div>

              {(productForm.paymentType === 'transfer' || productForm.paymentType === 'both') && (
                <div className={styles.formGroup}>
                  <label>Recargo por Transferencia (%)</label>
                  <input
                    type="number"
                    name="transferFeePercentage"
                    value={productForm.transferFeePercentage}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <span className={styles.feeNote}>
                    Recargo aplicado al pagar por transferencia bancaria
                  </span>
                </div>
              )}
            </div>

            {/* PREVIEW DE PRECIOS */}
            <div className={styles.paymentPreview}>
              <h5>💰 Preview de Precios</h5>
              <div className={styles.previewGrid}>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>💰 Precio en Efectivo:</span>
                  <span className={styles.previewPrice}>
                    {formatPriceWithCode(parseFloat(productForm.price) || 0)}
                  </span>
                </div>
                {(productForm.paymentType === 'transfer' || productForm.paymentType === 'both') && (
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>💳 Precio con Transferencia:</span>
                    <span className={styles.previewPrice}>
                      {formatPriceWithCode(calculateTransferPrice())}
                      <small>(+{productForm.transferFeePercentage}%)</small>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              💾 {editingProduct._id ? 'Actualizar' : 'Crear'} Producto
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-hipster">
              Cancelar
            </button>
          </div>
        </form>
      )}

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
                {product.featured && (
                  <span className={styles.featuredBadge}>⭐ DESTACADO</span>
                )}
              </div>
              <div className={styles.productInfo}>
                <h4>{product.name}</h4>
                <p className={styles.productPrice}>{formatPriceWithCode(product.price)}</p>
                <p className={styles.productStock}>📦 Stock: {product.stock || product.colors?.reduce((total, color) => total + (color.colorQuantity || 0), 0) || 0}</p>
                <p className={styles.productRating}>⭐ {product.stars} ({product.reviewCount} reseñas)</p>
                <p className={styles.productCategory}>📂 {product.category}</p>
                <p className={styles.productCompany}>🏢 {product.company}</p>
                
                <div className={`${styles.productShipping} ${product.isShippingAvailable ? styles.shippingEnabled : styles.shippingDisabled}`}>
                  {product.isShippingAvailable ? '🚚 Envío Disponible' : '🏪 Solo Recogida'}
                </div>
                
                <div className={`${styles.productCoupons} ${product.canUseCoupons ? styles.couponsEnabled : styles.couponsDisabled}`}>
                  {product.canUseCoupons ? '🎫 Acepta Cupones' : '🚫 Sin Cupones'}
                </div>

                <div className={`${styles.productPayment} ${styles[`payment${product.paymentType || 'both'}`]}`}>
                  {(product.paymentType || 'both') === 'cash' ? '💰 Solo Efectivo' : 
                   (product.paymentType || 'both') === 'transfer' ? '💳 Solo Transferencia' :
                   '💰💳 Ambos Métodos'}
                </div>
              </div>
              <div className={styles.productActions}>
                <button
                  onClick={() => editProduct(product)}
                  className="btn btn-primary"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteProduct(product._id)}
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

export default ProductManager;