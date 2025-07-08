import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import { useAllProductsContext } from '../../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../../contexts/ConfigContextProvider';
import styles from './CategoryManager.module.css';

const CategoryManager = () => {
  const { categories: categoriesFromContext, updateCategoriesFromAdmin } = useAllProductsContext();
  const { updateCategories } = useConfigContext();
  const [localCategories, setLocalCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const initialCategoryState = {
    categoryName: '',
    categoryImage: '',
    description: ''
  };

  const [categoryForm, setCategoryForm] = useState(initialCategoryState);

  // CARGAR CATEGORÍAS CON SINCRONIZACIÓN MEJORADA
  useEffect(() => {
    console.log('🔄 Cargando categorías en CategoryManager:', categoriesFromContext?.length || 0);
    
    // Cargar desde el contexto primero
    if (categoriesFromContext && categoriesFromContext.length > 0) {
      setLocalCategories(categoriesFromContext);
    } else {
      // Si no hay categorías en el contexto, intentar cargar desde localStorage
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.categories && parsedConfig.categories.length > 0) {
            console.log('📦 Cargando categorías desde localStorage:', parsedConfig.categories.length);
            setLocalCategories(parsedConfig.categories);
            // Sincronizar con el contexto
            updateCategoriesFromAdmin(parsedConfig.categories);
          }
        } catch (error) {
          console.error('Error al cargar categorías desde localStorage:', error);
        }
      }
    }
  }, [categoriesFromContext, updateCategoriesFromAdmin]);

  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN DE CATEGORÍAS
  useEffect(() => {
    const handleCategoriesUpdate = (event) => {
      const { categories: updatedCategories } = event.detail;
      console.log('📡 Evento de actualización de categorías recibido en CategoryManager');
      setLocalCategories(updatedCategories);
    };

    const handleConfigUpdate = () => {
      console.log('📡 Evento de actualización de configuración recibido en CategoryManager');
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.categories) {
            setLocalCategories(parsedConfig.categories);
          }
        } catch (error) {
          console.error('Error al cargar categorías desde configuración:', error);
        }
      }
    };

    // Agregar listeners
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('categoriesConfigUpdated', handleCategoriesUpdate);
    window.addEventListener('forceStoreUpdate', handleConfigUpdate);
    window.addEventListener('adminConfigChanged', handleConfigUpdate);

    // Cleanup
    return () => {
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
      // MANTENER EL TAMAÑO ACTUAL DE LAS CATEGORÍAS EXISTENTES
      // Analizando las imágenes actuales, mantienen proporción 4:3 responsiva
      const targetWidth = 400;  // Tamaño actual de las categorías
      const targetHeight = 300; // Proporción 4:3 como las actuales
      
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
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
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
        setCategoryForm(prev => ({ ...prev, categoryImage: resizedDataUrl }));
        setHasUnsavedChanges(true);
        toastHandler(ToastType.Success, 'Imagen optimizada manteniendo el tamaño actual de las categorías');
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!categoryForm.categoryName.trim()) {
      toastHandler(ToastType.Error, 'El nombre de la categoría es requerido');
      return;
    }
    
    if (!categoryForm.categoryImage.trim()) {
      toastHandler(ToastType.Error, 'La imagen de la categoría es requerida');
      return;
    }

    // Verificar nombre duplicado
    const isDuplicate = localCategories.some(category => 
      category.categoryName.toLowerCase() === categoryForm.categoryName.toLowerCase() && 
      category._id !== editingCategory?._id
    );

    if (isDuplicate) {
      toastHandler(ToastType.Error, 'Ya existe una categoría con este nombre');
      return;
    }

    // Crear categoría con estructura exacta de categories.js
    const newCategory = {
      "_id": editingCategory ? editingCategory._id : uuid(),
      "categoryName": categoryForm.categoryName.toLowerCase().trim(),
      "categoryImage": categoryForm.categoryImage,
      "description": categoryForm.description || "",
      "id": editingCategory ? editingCategory.id : (localCategories.length + 1).toString(),
      "disabled": editingCategory ? editingCategory.disabled : false // Mantener estado o false por defecto
    };

    let updatedCategories;
    if (editingCategory) {
      updatedCategories = localCategories.map(c => c._id === editingCategory._id ? newCategory : c);
      toastHandler(ToastType.Success, '✅ Categoría actualizada exitosamente');
    } else {
      updatedCategories = [...localCategories, newCategory];
      toastHandler(ToastType.Success, '✅ Categoría creada exitosamente');
    }

    // SINCRONIZACIÓN COMPLETA Y INMEDIATA MEJORADA
    performCompleteSync(updatedCategories);
    
    resetForm();
  };

  // Función para sincronización completa MEJORADA CON PERSISTENCIA GARANTIZADA
  const performCompleteSync = (updatedCategories) => {
    console.log('🔄 Iniciando sincronización completa de categorías...');
    
    // 1. Actualizar estado local inmediatamente
    setLocalCategories(updatedCategories);
    
    // 2. Actualizar en localStorage para persistencia inmediata con verificación
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    config.categories = updatedCategories;
    config.lastModified = new Date().toISOString();
    
    // Guardar con verificación
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Verificar que se guardó correctamente
    const verifyConfig = localStorage.getItem('adminStoreConfig');
    if (verifyConfig) {
      try {
        const parsedVerify = JSON.parse(verifyConfig);
        if (parsedVerify.categories && parsedVerify.categories.length === updatedCategories.length) {
          console.log('✅ Categorías guardadas correctamente en localStorage');
        }
      } catch (error) {
        console.error('Error en verificación de guardado:', error);
      }
    }
    
    // 3. Actualizar en el contexto de configuración para backup
    updateCategories(updatedCategories);
    
    // 4. Actualizar en el contexto de productos para sincronización inmediata en la tienda
    updateCategoriesFromAdmin(updatedCategories);
    
    // 5. Disparar múltiples eventos para garantizar sincronización completa
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('categoriesUpdated', { 
        detail: { categories: updatedCategories } 
      }));
      
      window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
      
      // NUEVO: Evento específico para cambios de configuración del admin
      window.dispatchEvent(new CustomEvent('adminConfigChanged', { 
        detail: { categories: updatedCategories, type: 'categories' } 
      }));
      
      // Forzar re-renderizado adicional
      window.dispatchEvent(new CustomEvent('categoriesConfigUpdated', { 
        detail: { categories: updatedCategories } 
      }));
    }, 50);

    // 6. Verificación adicional para asegurar sincronización
    setTimeout(() => {
      const currentConfig = localStorage.getItem('adminStoreConfig');
      if (currentConfig) {
        try {
          const parsedConfig = JSON.parse(currentConfig);
          if (parsedConfig.categories && parsedConfig.categories.length === updatedCategories.length) {
            console.log('✅ Sincronización de categorías verificada exitosamente');
            toastHandler(ToastType.Info, '🔄 Categorías sincronizadas en tiempo real');
          }
        } catch (error) {
          console.error('Error en verificación de sincronización:', error);
        }
      }
    }, 200);

    console.log('✅ Sincronización de categorías completada');
  };

  const resetForm = () => {
    setCategoryForm(initialCategoryState);
    setEditingCategory(null);
    setShowForm(false);
    setHasUnsavedChanges(false);
  };

  const editCategory = (category) => {
    setCategoryForm({
      categoryName: category.categoryName,
      categoryImage: category.categoryImage,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowForm(true);
    setHasUnsavedChanges(false);
  };

  const toggleCategoryStatus = (categoryId) => {
    const updatedCategories = localCategories.map(c => 
      c._id === categoryId 
        ? { ...c, disabled: !c.disabled }
        : c
    );

    // SINCRONIZACIÓN COMPLETA
    performCompleteSync(updatedCategories);
    
    const category = localCategories.find(c => c._id === categoryId);
    toastHandler(ToastType.Success, 
      `✅ Categoría ${category.disabled ? 'habilitada' : 'deshabilitada'} exitosamente`
    );
  };

  const deleteCategory = (categoryId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Esta acción afectará todos los productos de esta categoría.')) {
      return;
    }

    const updatedCategories = localCategories.filter(c => c._id !== categoryId);
    
    // SINCRONIZACIÓN COMPLETA
    performCompleteSync(updatedCategories);
    
    toastHandler(ToastType.Success, '✅ Categoría eliminada exitosamente');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    resetForm();
  };

  // Verificar si hay cambios pendientes
  const hasChanges = localCategories.length !== categoriesFromContext.length || 
    JSON.stringify(localCategories) !== JSON.stringify(categoriesFromContext);

  return (
    <div className={styles.categoryManager}>
      <div className={styles.header}>
        <h2>📂 Gestión de Categorías</h2>
        <div className={styles.headerActions}>
          {hasChanges && (
            <span className={styles.changesIndicator}>
              🟢 Cambios aplicados en tiempo real
            </span>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Nueva Categoría'}
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Información Importante</h4>
        <p>Los cambios se aplican automáticamente en la tienda. Las imágenes mantienen el tamaño actual de las categorías existentes (400x300px responsivo). Las categorías deshabilitadas no aparecen en el inicio de la tienda. Para exportar los cambios permanentemente, ve a la sección "🗂️ Sistema Backup".</p>
      </div>

      {/* INDICADOR DE ESTADO DE CATEGORÍAS */}
      <div className={styles.statusIndicator}>
        <h4>📊 Estado Actual de Categorías</h4>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusNumber}>{localCategories.length}</span>
            <span className={styles.statusLabel}>Total</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusNumber}>{localCategories.filter(c => !c.disabled).length}</span>
            <span className={styles.statusLabel}>Activas</span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusNumber}>{localCategories.filter(c => c.disabled).length}</span>
            <span className={styles.statusLabel}>Deshabilitadas</span>
          </div>
        </div>
      </div>

      {showForm && (
        <form className={styles.categoryForm} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            {hasUnsavedChanges && (
              <span className={styles.unsavedIndicator}>
                🔴 Cambios sin guardar
              </span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nombre de la Categoría *</label>
              <input
                type="text"
                name="categoryName"
                value={categoryForm.categoryName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ej: smartphones"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                name="description"
                value={categoryForm.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Descripción de la categoría"
                rows="3"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Imagen de la Categoría * (Mantiene el tamaño actual: 400x300px responsivo)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-input"
            />
            <small>O ingresa una URL de imagen:</small>
            <input
              type="url"
              name="categoryImage"
              value={categoryForm.categoryImage}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
            {categoryForm.categoryImage && (
              <div className={styles.imagePreview}>
                <img src={categoryForm.categoryImage} alt="Preview" />
                <small>Tamaño: 400x300px (igual que las categorías actuales)</small>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              💾 {editingCategory ? 'Actualizar' : 'Crear'} Categoría
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-hipster">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.categoriesList}>
        <div className={styles.listHeader}>
          <h3>Categorías Existentes ({localCategories.length})</h3>
          {hasChanges && (
            <div className={styles.changesAlert}>
              <span>🟢 Los cambios se han aplicado en tiempo real en la tienda</span>
              <small>Ve a "🗂️ Sistema Backup" para exportar los cambios</small>
            </div>
          )}
        </div>

        {localCategories.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>📂 No hay categorías creadas</h3>
            <p>Crea tu primera categoría para organizar los productos de la tienda.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              ➕ Crear Primera Categoría
            </button>
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {localCategories.map(category => (
              <div key={category._id} className={`${styles.categoryCard} ${category.disabled ? styles.disabled : ''}`}>
                <div className={styles.categoryImage}>
                  <img src={category.categoryImage} alt={category.categoryName} />
                  {category.disabled && (
                    <div className={styles.disabledOverlay}>
                      <span>DESHABILITADA</span>
                    </div>
                  )}
                </div>
                <div className={styles.categoryInfo}>
                  <h4>{category.categoryName}</h4>
                  {category.description && (
                    <p>{category.description}</p>
                  )}
                  <span className={`${styles.status} ${category.disabled ? styles.statusDisabled : styles.statusActive}`}>
                    {category.disabled ? 'Deshabilitada (No aparece en tienda)' : 'Activa (Visible en tienda)'}
                  </span>
                </div>
                <div className={styles.categoryActions}>
                  <button
                    onClick={() => editCategory(category)}
                    className="btn btn-primary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleCategoryStatus(category._id)}
                    className={`btn ${category.disabled ? 'btn-success' : 'btn-hipster'}`}
                  >
                    {category.disabled ? 'Habilitar' : 'Deshabilitar'}
                  </button>
                  <button
                    onClick={() => deleteCategory(category._id)}
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

export default CategoryManager;