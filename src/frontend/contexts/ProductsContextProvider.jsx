import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { toastHandler, wait } from '../utils/utils';
import {
  deleteCartDataService,
  deleteFromCartService,
  deleteFromWishlistService,
  deleteWishlistDataService,
  getAllProductsCategoriesService,
  incDecItemInCartService,
  postAddToCartService,
  postAddToWishlistService,
} from '../Services/services';

import { productsReducer } from '../reducers';
import { PRODUCTS_ACTION } from '../utils/actions';
import { ToastType, DELAY_TO_SHOW_LOADER } from '../constants/constants';
import { useAuthContext } from './AuthContextProvider';
import { initialProductsState } from '../reducers/productsReducer';

const ProductsContext = createContext(null);

export const useAllProductsContext = () => useContext(ProductsContext);

const ProductsContextProvider = ({ children }) => {
  const [productsState, dispatch] = useReducer(
    productsReducer,
    initialProductsState
  );

  const { user, token: tokenFromContext } = useAuthContext();

  // fns
  const showMainPageLoader = () => {
    dispatch({ type: PRODUCTS_ACTION.SHOW_LOADER });
  };

  const hideMainPageLoader = () => {
    dispatch({ type: PRODUCTS_ACTION.HIDE_LOADER });
  };

  const timedMainPageLoader = async () => {
    showMainPageLoader();
    await wait(DELAY_TO_SHOW_LOADER);
    hideMainPageLoader();
  };

  const updateCart = (cartList) => {
    dispatch({
      type: PRODUCTS_ACTION.UPDATE_CART,
      payload: { cart: cartList },
    });
  };

  const updateWishlist = (wishlistUpdated) => {
    dispatch({
      type: PRODUCTS_ACTION.UPDATE_WISHLIST,
      payload: { wishlist: wishlistUpdated },
    });
  };

  const clearCartInContext = () => {
    updateCart([]);
  };

  const clearWishlistInContext = () => {
    updateWishlist([]);
  };

  const fetchAllProductsAndCategories = async () => {
    dispatch({ type: PRODUCTS_ACTION.GET_ALL_PRODUCTS_BEGIN });
    await wait(DELAY_TO_SHOW_LOADER);

    try {
      // Primero intentar cargar desde la configuración guardada
      const savedConfig = localStorage.getItem('adminStoreConfig');
      let products = [];
      let categories = [];

      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products && parsedConfig.products.length > 0) {
            products = parsedConfig.products;
            console.log('📦 Productos cargados desde configuración del admin:', products.length);
          }
          if (parsedConfig.categories && parsedConfig.categories.length > 0) {
            categories = parsedConfig.categories;
            console.log('📂 Categorías cargadas desde configuración del admin:', categories.length);
          }
        } catch (error) {
          console.error('Error al cargar configuración guardada:', error);
        }
      }

      // Si no hay datos guardados, cargar desde el servicio
      if (products.length === 0 || categories.length === 0) {
        console.log('📡 Cargando datos desde el servicio...');
        const serviceData = await getAllProductsCategoriesService();
        if (products.length === 0) products = serviceData.products;
        if (categories.length === 0) categories = serviceData.categories;
      }

      dispatch({
        type: PRODUCTS_ACTION.GET_ALL_PRODUCTS_FULFILLED,
        payload: { products, categories },
      });
    } catch (error) {
      dispatch({ type: PRODUCTS_ACTION.GET_ALL_PRODUCTS_REJECTED });
      console.error(error);
    }
  };

  // FUNCIÓN MEJORADA PARA SINCRONIZACIÓN COMPLETA E INMEDIATA DE PRODUCTOS
  const updateProductsFromAdmin = (newProducts) => {
    console.log('🔄 Iniciando sincronización completa de productos...');
    
    // 1. Actualizar en el reducer inmediatamente
    dispatch({
      type: PRODUCTS_ACTION.UPDATE_PRODUCTS_FROM_ADMIN,
      payload: { products: newProducts },
    });

    // 2. Guardar en localStorage para persistencia con verificación
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    config.products = newProducts;
    config.lastModified = new Date().toISOString();
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Verificar que se guardó correctamente
    const verifyConfig = localStorage.getItem('adminStoreConfig');
    if (verifyConfig) {
      try {
        const parsedVerify = JSON.parse(verifyConfig);
        if (parsedVerify.products && parsedVerify.products.length === newProducts.length) {
          console.log('✅ Productos guardados correctamente en localStorage');
        }
      } catch (error) {
        console.error('Error en verificación de guardado de productos:', error);
      }
    }
    
    // 3. Disparar eventos de sincronización inmediata
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products: newProducts } 
      }));
      
      window.dispatchEvent(new CustomEvent('productsConfigUpdated', { 
        detail: { products: newProducts } 
      }));
      
      window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
      
      window.dispatchEvent(new CustomEvent('adminConfigChanged', { 
        detail: { products: newProducts, type: 'products' } 
      }));
      
      dispatch({
        type: PRODUCTS_ACTION.FORCE_UPDATE_PRODUCTS,
        payload: { products: newProducts },
      });
      
      // Sincronizar con otros componentes del admin panel
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'products', data: newProducts } 
      }));
    }, 10);

    console.log('✅ Sincronización de productos completada');
  };

  // FUNCIÓN MEJORADA PARA SINCRONIZACIÓN COMPLETA E INMEDIATA DE CATEGORÍAS
  const updateCategoriesFromAdmin = (newCategories) => {
    console.log('🔄 Iniciando sincronización completa de categorías...');
    
    // 1. Actualizar en el reducer inmediatamente
    dispatch({
      type: PRODUCTS_ACTION.UPDATE_CATEGORIES_FROM_ADMIN,
      payload: { categories: newCategories },
    });

    // 2. Guardar en localStorage para persistencia con verificación
    const savedConfig = localStorage.getItem('adminStoreConfig') || '{}';
    let config = {};
    
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      config = {};
    }

    config.categories = newCategories;
    config.lastModified = new Date().toISOString();
    localStorage.setItem('adminStoreConfig', JSON.stringify(config));
    
    // Verificar que se guardó correctamente
    const verifyConfig = localStorage.getItem('adminStoreConfig');
    if (verifyConfig) {
      try {
        const parsedVerify = JSON.parse(verifyConfig);
        if (parsedVerify.categories && parsedVerify.categories.length === newCategories.length) {
          console.log('✅ Categorías guardadas correctamente en localStorage');
        }
      } catch (error) {
        console.error('Error en verificación de guardado de categorías:', error);
      }
    }
    
    // 3. Disparar eventos de sincronización inmediata
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('categoriesUpdated', { 
        detail: { categories: newCategories } 
      }));
      
      window.dispatchEvent(new CustomEvent('categoriesConfigUpdated', { 
        detail: { categories: newCategories } 
      }));
      
      window.dispatchEvent(new CustomEvent('forceStoreUpdate'));
      
      window.dispatchEvent(new CustomEvent('adminConfigChanged', { 
        detail: { categories: newCategories, type: 'categories' } 
      }));
      
      dispatch({
        type: PRODUCTS_ACTION.FORCE_UPDATE_CATEGORIES,
        payload: { categories: newCategories },
      });
      
      // Sincronizar con otros componentes del admin panel
      window.dispatchEvent(new CustomEvent('adminPanelSync', { 
        detail: { type: 'categories', data: newCategories } 
      }));
    }, 10);

    console.log('✅ Sincronización de categorías completada');
  };

  // useEffects
  useEffect(() => {
    fetchAllProductsAndCategories();
  }, []);

  useEffect(() => {
    if (!user) return;

    updateCart(user.cart);
    updateWishlist(user.wishlist);
  }, [user]);

  // ESCUCHAR EVENTOS DE ACTUALIZACIÓN MEJORADOS CON VERIFICACIÓN
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      const { products: updatedProducts } = event.detail;
      console.log('📡 Evento de actualización de productos recibido en ProductsContext');
      
      dispatch({
        type: PRODUCTS_ACTION.UPDATE_PRODUCTS_FROM_ADMIN,
        payload: { products: updatedProducts },
      });
    };

    const handleCategoriesUpdate = (event) => {
      const { categories: updatedCategories } = event.detail;
      console.log('📡 Evento de actualización de categorías recibido en ProductsContext');
      
      dispatch({
        type: PRODUCTS_ACTION.UPDATE_CATEGORIES_FROM_ADMIN,
        payload: { categories: updatedCategories },
      });
    };

    const handleForceUpdate = () => {
      console.log('🔄 Forzando actualización completa en ProductsContext...');
      
      const savedConfig = localStorage.getItem('adminStoreConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig.products) {
            dispatch({
              type: PRODUCTS_ACTION.UPDATE_PRODUCTS_FROM_ADMIN,
              payload: { products: parsedConfig.products },
            });
          }
          if (parsedConfig.categories) {
            dispatch({
              type: PRODUCTS_ACTION.UPDATE_CATEGORIES_FROM_ADMIN,
              payload: { categories: parsedConfig.categories },
            });
          }
        } catch (error) {
          console.error('Error al forzar actualización:', error);
        }
      }
    };

    const handleAdminConfigChange = (event) => {
      const { type, products: updatedProducts, categories: updatedCategories } = event.detail;
      console.log(`🔧 Cambio de configuración del admin detectado: ${type}`);
      
      if (type === 'products' && updatedProducts) {
        dispatch({
          type: PRODUCTS_ACTION.UPDATE_PRODUCTS_FROM_ADMIN,
          payload: { products: updatedProducts },
        });
      }
      
      if (type === 'categories' && updatedCategories) {
        dispatch({
          type: PRODUCTS_ACTION.UPDATE_CATEGORIES_FROM_ADMIN,
          payload: { categories: updatedCategories },
        });
      }
    };

    // Agregar listeners
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('forceStoreUpdate', handleForceUpdate);
    window.addEventListener('adminConfigChanged', handleAdminConfigChange);

    // Cleanup
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('forceStoreUpdate', handleForceUpdate);
      window.removeEventListener('adminConfigChanged', handleAdminConfigChange);
    };
  }, []);

  // fns to get data from services and update state
  const addToCartDispatch = async (productToAdd) => {
    try {
      const cart = await postAddToCartService(productToAdd, tokenFromContext);
      updateCart(cart);
      toastHandler(ToastType.Success, 'Agregado al carrito exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const addToWishlistDispatch = async (productToAdd) => {
    try {
      const wishlist = await postAddToWishlistService(
        productToAdd,
        tokenFromContext
      );

      updateWishlist(wishlist);

      toastHandler(ToastType.Success, 'Agregado a lista de deseos exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const removeFromCartDispatch = async (productId) => {
    try {
      const cart = await deleteFromCartService(productId, tokenFromContext);

      updateCart(cart);
      toastHandler(ToastType.Warn, 'Removido del carrito exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const removeFromWishlistDispatch = async (productId) => {
    try {
      const wishlist = await deleteFromWishlistService(
        productId,
        tokenFromContext
      );

      updateWishlist(wishlist);
      toastHandler(ToastType.Warn, 'Removido de lista de deseos exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const clearWishlistDispatch = async () => {
    showMainPageLoader();
    try {
      const wishlist = await deleteWishlistDataService(tokenFromContext);

      updateWishlist(wishlist);
      hideMainPageLoader();
    } catch (error) {
      console.log(error.response);
      hideMainPageLoader();
    }
  };

  const clearCartDispatch = async () => {
    showMainPageLoader();
    try {
      const cart = await deleteCartDataService(tokenFromContext);

      updateCart(cart);

      hideMainPageLoader();
    } catch (error) {
      console.log(error.response);
      hideMainPageLoader();
    }
  };

  const moveToWishlistDispatch = async (product) => {
    try {
      const [wishlist, cart] = await Promise.all([
        postAddToWishlistService(product, tokenFromContext),
        deleteFromCartService(product._id, tokenFromContext),
      ]);

      updateCart(cart);
      updateWishlist(wishlist);
      toastHandler(ToastType.Success, 'Movido a lista de deseos exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const moveToCartDispatch = async (product) => {
    // this will be called from the wishlist page
    try {
      const [cart, wishlist] = await Promise.all([
        postAddToCartService(product, tokenFromContext),
        deleteFromWishlistService(product._id, tokenFromContext),
      ]);

      updateCart(cart);
      updateWishlist(wishlist);
      toastHandler(ToastType.Success, 'Movido al carrito exitosamente');
    } catch (error) {
      console.log(error.response);
    }
  };

  const addOrRemoveQuantityInCart = async ({ productId, type, colorBody }) => {
    try {
      const cart = await incDecItemInCartService({
        productId,
        type,
        token: tokenFromContext,
        colorBody,
      });

      updateCart(cart);
    } catch (error) {
      console.log(error.response);
    }
  };

  // address

  const addAddressDispatch = (addressObj) => {
    toastHandler(ToastType.Success, 'Dirección agregada exitosamente');
    dispatch({
      type: PRODUCTS_ACTION.ADD_ADDRESS,
      payload: {
        address: addressObj,
      },
    });
  };

  const editAddressDispatch = (addressObj) => {
    toastHandler(ToastType.Success, 'Dirección actualizada exitosamente');
    dispatch({
      type: PRODUCTS_ACTION.EDIT_ADDRESS,
      payload: {
        address: addressObj,
      },
    });
  };

  const deleteAddressDispatch = (addressId) => {
    toastHandler(ToastType.Success, 'Dirección eliminada exitosamente');
    dispatch({
      type: PRODUCTS_ACTION.DELETE_ADDRESS,
      payloadId: addressId,
    });
  };

  const deleteAllAddressDispatch = async () => {
    await timedMainPageLoader();
    toastHandler(ToastType.Success, 'Todas las direcciones eliminadas exitosamente');
    dispatch({
      type: PRODUCTS_ACTION.DELETE_ALL_ADDRESS,
    });
  };

  const clearAddressInContext = () => {
    dispatch({
      type: PRODUCTS_ACTION.DELETE_ALL_ADDRESS,
    });
  };

  return (
    <ProductsContext.Provider
      value={{
        ...productsState,
        isMainPageLoading: productsState.isDataLoading,
        showMainPageLoader,
        hideMainPageLoader,
        timedMainPageLoader,
        addToCartDispatch,
        addToWishlistDispatch,
        removeFromWishlistDispatch,
        clearWishlistDispatch,
        clearCartDispatch,
        moveToCartDispatch,
        moveToWishlistDispatch,
        removeFromCartDispatch,
        addOrRemoveQuantityInCart,
        addAddressDispatch,
        editAddressDispatch,
        deleteAddressDispatch,
        deleteAllAddressDispatch,
        clearCartInContext,
        clearWishlistInContext,
        clearAddressInContext,
        updateProductsFromAdmin,
        updateCategoriesFromAdmin,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContextProvider;