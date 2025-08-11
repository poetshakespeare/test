import React, { useState, useEffect } from 'react';
import { toastHandler } from '../../../utils/utils';
import { ToastType } from '../../../constants/constants';
import styles from './MessagesManager.module.css';

const MessagesManager = () => {
  const [messages, setMessages] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mensajes predefinidos de la tienda organizados por categorías
  const defaultMessages = {
    navigation: {
      'Explorar': 'Explorar',
      'Iniciar Sesión': 'Iniciar Sesión',
      'Perfil': 'Perfil',
      'Direcciones': 'Direcciones',
      'Panel de Control': 'Panel de Control',
      'cerrar sesión': 'cerrar sesión'
    },
    products: {
      'Productos Destacados': 'Productos Destacados',
      'Categorías': 'Categorías',
      'En Stock': 'En Stock',
      'Agotado': 'Agotado',
      'Envío Disponible': 'Envío Disponible',
      'Agregar al Carrito': 'Agregar al Carrito',
      'Agregar a Lista de Deseos': 'Agregar a Lista de Deseos',
      'Ir al Carrito': 'Ir al Carrito',
      'Ir a Lista de Deseos': 'Ir a Lista de Deseos',
      'Mover a Lista de Deseos': 'Mover a Lista de Deseos',
      'Mover al Carrito': 'Mover al Carrito',
      'Remover del Carrito': 'Remover del Carrito',
      'Limpiar Carrito': 'Limpiar Carrito',
      'Limpiar Lista de Deseos': 'Limpiar Lista de Deseos'
    },
    cart: {
      'carrito': 'carrito',
      'lista de deseos': 'lista de deseos',
      'Detalles del Precio del Carrito': 'Detalles del Precio del Carrito',
      'Precio Total': 'Precio Total',
      'Finalizar Compra': 'Finalizar Compra',
      'Tu carrito está vacío! ☹️': 'Tu carrito está vacío! ☹️',
      'Tu lista de deseos está vacía! ☹️': 'Tu lista de deseos está vacía! ☹️'
    },
    checkout: {
      'Finalizar Compra': 'Finalizar Compra',
      'Elige una dirección de entrega': 'Elige una dirección de entrega',
      'Detalles del Precio': 'Detalles del Precio',
      'Entrega a domicilio': 'Entrega a domicilio',
      'Recoger en local': 'Recoger en local',
      'Realizar Pedido por WhatsApp': 'Realizar Pedido por WhatsApp',
      'Tu pedido se ha realizado exitosamente 🎉': 'Tu pedido se ha realizado exitosamente 🎉'
    },
    forms: {
      'Nombre': 'Nombre',
      'Apellido': 'Apellido',
      'Correo Electrónico': 'Correo Electrónico',
      'Contraseña': 'Contraseña',
      'Confirmar Contraseña': 'Confirmar Contraseña',
      'Iniciar Sesión': 'Iniciar Sesión',
      'Registrarse': 'Registrarse',
      'Crear Nueva Cuenta': 'Crear Nueva Cuenta',
      'Iniciar como Invitado': 'Iniciar como Invitado',
      'Acceso Administrador': 'Acceso Administrador'
    },
    address: {
      'Nueva Dirección': 'Nueva Dirección',
      'Editar Dirección': 'Editar Dirección',
      'Agregar nueva dirección': 'Agregar nueva dirección',
      'Tipo de Servicio': 'Tipo de Servicio',
      'Entrega a domicilio': 'Entrega a domicilio',
      'Pedido para recoger en el local': 'Pedido para recoger en el local',
      'Dirección': 'Dirección',
      'Número de Móvil': 'Número de Móvil',
      '¿Quién recibe el pedido?': '¿Quién recibe el pedido?',
      '¿Quieres aclararnos algo?': '¿Quieres aclararnos algo?'
    },
    buttons: {
      'Guardar': 'Guardar',
      'Cancelar': 'Cancelar',
      'Editar': 'Editar',
      'Eliminar': 'Eliminar',
      'Actualizar': 'Actualizar',
      'Restablecer': 'Restablecer',
      'Limpiar Filtros': 'Limpiar Filtros',
      'Aplicar': 'Aplicar',
      'Exportar': 'Exportar',
      'Importar': 'Importar'
    },
    notifications: {
      'Sesión cerrada exitosamente': 'Sesión cerrada exitosamente',
      'Producto agregado al carrito': 'Producto agregado al carrito',
      'Producto agregado a lista de deseos': 'Producto agregado a lista de deseos',
      'Carrito limpiado exitosamente': 'Carrito limpiado exitosamente',
      'Lista de deseos limpiada exitosamente': 'Lista de deseos limpiada exitosamente',
      'Por favor inicia sesión para continuar': 'Por favor inicia sesión para continuar',
      'Configuración guardada exitosamente': 'Configuración guardada exitosamente'
    },
    errors: {
      'Error': 'Error',
      'Error: Producto No Encontrado': 'Error: Producto No Encontrado',
      'Por favor completa todos los campos obligatorios': 'Por favor completa todos los campos obligatorios',
      'Por favor ingresa un email válido': 'Por favor ingresa un email válido',
      'La contraseña debe tener al menos 6 caracteres': 'La contraseña debe tener al menos 6 caracteres',
      'Las contraseñas no coinciden': 'Las contraseñas no coinciden'
    }
  };

  useEffect(() => {
    // Cargar mensajes desde localStorage o usar los predeterminados
    const savedMessages = localStorage.getItem('storeMessages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        setMessages(defaultMessages);
      }
    } else {
      setMessages(defaultMessages);
    }
  }, []);

  const saveMessages = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem('storeMessages', JSON.stringify(newMessages));
    setHasUnsavedChanges(false);
    toastHandler(ToastType.Success, '✅ Mensajes guardados en memoria');
    toastHandler(ToastType.Info, 'Para aplicar los cambios, ve a "💾 Exportar/Importar" y exporta la configuración');
    
    // Disparar eventos de sincronización
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('messagesUpdated', { 
        detail: { messages: newMessages } 
      }));
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'messages', data: newMessages } 
      }));
    }, 10);
  };

  const handleMessageEdit = (category, key, newValue) => {
    const updatedMessages = {
      ...messages,
      [category]: {
        ...messages[category],
        [key]: newValue
      }
    };
    setMessages(updatedMessages);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    saveMessages(messages);
  };

  const handleResetMessages = () => {
    if (window.confirm('¿Estás seguro de restablecer todos los mensajes a los valores por defecto?')) {
      setMessages(defaultMessages);
      localStorage.setItem('storeMessages', JSON.stringify(defaultMessages));
      setHasUnsavedChanges(false);
      toastHandler(ToastType.Success, 'Mensajes restablecidos a valores por defecto');
      
      // Disparar eventos de sincronización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('messagesUpdated', { 
          detail: { messages: defaultMessages } 
        }));
        window.dispatchEvent(new CustomEvent('adminPanelSync', { 
          detail: { type: 'messages', data: defaultMessages } 
        }));
      }, 10);
    }
  };

  const getFilteredMessages = () => {
    let filteredMessages = {};
    
    Object.keys(messages).forEach(category => {
      if (selectedCategory === 'all' || selectedCategory === category) {
        const categoryMessages = {};
        Object.keys(messages[category]).forEach(key => {
          const message = messages[category][key];
          if (!searchTerm || 
              key.toLowerCase().includes(searchTerm.toLowerCase()) ||
              message.toLowerCase().includes(searchTerm.toLowerCase())) {
            categoryMessages[key] = message;
          }
        });
        if (Object.keys(categoryMessages).length > 0) {
          filteredMessages[category] = categoryMessages;
        }
      }
    });
    
    return filteredMessages;
  };

  const filteredMessages = getFilteredMessages();
  const totalMessages = Object.values(messages).reduce((total, category) => total + Object.keys(category).length, 0);

  const categories = [
    { id: 'all', name: 'Todas las Categorías', icon: '📋' },
    { id: 'navigation', name: 'Navegación', icon: '🧭' },
    { id: 'products', name: 'Productos', icon: '📦' },
    { id: 'cart', name: 'Carrito y Lista', icon: '🛒' },
    { id: 'checkout', name: 'Finalizar Compra', icon: '💳' },
    { id: 'forms', name: 'Formularios', icon: '📝' },
    { id: 'address', name: 'Direcciones', icon: '📍' },
    { id: 'buttons', name: 'Botones', icon: '🔘' },
    { id: 'notifications', name: 'Notificaciones', icon: '🔔' },
    { id: 'errors', name: 'Errores', icon: '❌' }
  ];

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? `${category.icon} ${category.name}` : categoryId;
  };

  return (
    <div className={styles.messagesManager}>
      <div className={styles.header}>
        <h2>💬 Gestión de Mensajes de la Tienda</h2>
        <div className={styles.headerActions}>
          {hasUnsavedChanges && (
            <span className={styles.changesIndicator}>
              🔴 Cambios pendientes
            </span>
          )}
          <button 
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className="btn btn-primary"
          >
            💾 Guardar Cambios
          </button>
          <button 
            onClick={handleResetMessages}
            className="btn btn-danger"
          >
            🔄 Restablecer
          </button>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h4>ℹ️ Información Importante</h4>
        <p>Aquí puedes editar todos los mensajes y textos que aparecen en la tienda. Los cambios se guardan temporalmente en memoria. Para aplicarlos permanentemente, ve a la sección "💾 Exportar/Importar" y exporta la configuración.</p>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h4>📊 Estadísticas de Mensajes</h4>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{totalMessages}</span>
              <span className={styles.statLabel}>Mensajes Totales</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{Object.keys(messages).length}</span>
              <span className={styles.statLabel}>Categorías</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {Object.keys(filteredMessages).reduce((total, cat) => total + Object.keys(filteredMessages[cat]).length, 0)}
              </span>
              <span className={styles.statLabel}>Mensajes Filtrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar mensajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`form-input ${styles.searchInput}`}
          />
        </div>

        <div className={styles.categoryFilter}>
          <label>Filtrar por categoría:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {Object.keys(filteredMessages).length === 0 ? (
          <div className={styles.noResults}>
            <h3>🔍 No se encontraron mensajes</h3>
            <p>Intenta cambiar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          Object.keys(filteredMessages).map(category => (
            <div key={category} className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>
                {getCategoryName(category)} ({Object.keys(filteredMessages[category]).length} mensajes)
              </h3>
              
              <div className={styles.messagesList}>
                {Object.keys(filteredMessages[category]).map(messageKey => (
                  <div key={messageKey} className={styles.messageItem}>
                    <div className={styles.messageKey}>
                      <strong>Clave:</strong> {messageKey}
                    </div>
                    <div className={styles.messageValue}>
                      <label>Mensaje:</label>
                      <input
                        type="text"
                        value={messages[category][messageKey]}
                        onChange={(e) => handleMessageEdit(category, messageKey, e.target.value)}
                        className="form-input"
                        placeholder="Ingresa el mensaje..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.infoSection}>
        <h3>ℹ️ Información del Sistema de Mensajes</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>🎯 Propósito:</strong> Centraliza todos los textos y mensajes de la tienda para fácil traducción y personalización
          </div>
          <div className={styles.infoItem}>
            <strong>📂 Organización:</strong> Los mensajes están organizados por categorías funcionales
          </div>
          <div className={styles.infoItem}>
            <strong>🔍 Búsqueda:</strong> Busca mensajes por clave o contenido
          </div>
          <div className={styles.infoItem}>
            <strong>💾 Guardado:</strong> Los cambios se guardan en memoria y se exportan en el JSON de configuración
          </div>
          <div className={styles.infoItem}>
            <strong>🌐 Idiomas:</strong> Perfecto para crear versiones en diferentes idiomas
          </div>
          <div className={styles.infoItem}>
            <strong>🔄 Restauración:</strong> Puedes restablecer todos los mensajes a los valores por defecto
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesManager;