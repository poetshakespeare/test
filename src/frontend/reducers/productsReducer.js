import { PRODUCTS_ACTION } from '../utils/actions';

export const initialProductsState = {
  isDataLoading: true,
  products: [],
  categories: [],
  isDataError: false,
  wishlist: [],
  cart: [],
  cartDetails: {
    totalAmount: 0,
    totalCount: 0,
  },
  addressList: [],
};

export const productsReducer = (state, action) => {
  switch (action.type) {
    case PRODUCTS_ACTION.GET_ALL_PRODUCTS_BEGIN: {
      return {
        ...state,
        isDataLoading: true,
        isDataError: false,
      };
    }

    case PRODUCTS_ACTION.GET_ALL_PRODUCTS_FULFILLED: {
      return {
        ...state,
        isDataLoading: false,
        products: [...action.payload.products],
        categories: [...action.payload.categories],
        isDataError: false,
      };
    }

    case PRODUCTS_ACTION.GET_ALL_PRODUCTS_REJECTED: {
      return {
        ...state,
        isDataLoading: false,
        isDataError: true,
      };
    }

    case PRODUCTS_ACTION.SHOW_LOADER: {
      return {
        ...state,
        isDataLoading: true,
      };
    }

    case PRODUCTS_ACTION.HIDE_LOADER: {
      return {
        ...state,
        isDataLoading: false,
      };
    }

    case PRODUCTS_ACTION.UPDATE_CART: {
      const cart = [...action.payload.cart];

      const cartDetails = cart.reduce(
        ({ totalAmount, totalCount }, { qty, price }) => {
          return {
            totalCount: totalCount + qty,
            totalAmount: totalAmount + qty * price,
          };
        },
        {
          totalAmount: 0,
          totalCount: 0,
        }
      );

      return {
        ...state,
        cart: cart,
        cartDetails: cartDetails,
      };
    }

    case PRODUCTS_ACTION.UPDATE_WISHLIST: {
      return {
        ...state,
        wishlist: [...action.payload.wishlist],
      };
    }

    // ACCIONES MEJORADAS PARA SINCRONIZACIÓN COMPLETA
    case PRODUCTS_ACTION.UPDATE_PRODUCTS_FROM_ADMIN:
    case PRODUCTS_ACTION.FORCE_UPDATE_PRODUCTS: {
      console.log('🔄 Actualizando productos en reducer:', action.payload.products.length);
      return {
        ...state,
        products: [...action.payload.products],
      };
    }

    case PRODUCTS_ACTION.UPDATE_CATEGORIES_FROM_ADMIN:
    case PRODUCTS_ACTION.FORCE_UPDATE_CATEGORIES: {
      console.log('🔄 Actualizando categorías en reducer:', action.payload.categories.length);
      return {
        ...state,
        categories: [...action.payload.categories],
      };
    }

    case PRODUCTS_ACTION.ADD_ADDRESS: {
      return {
        ...state,
        addressList: [...state.addressList, action.payload.address],
      };
    }

    case PRODUCTS_ACTION.DELETE_ADDRESS: {
      const filteredAddressList = state.addressList.filter(
        ({ addressId }) => addressId !== action.payloadId
      );
      return {
        ...state,
        addressList: filteredAddressList,
      };
    }

    case PRODUCTS_ACTION.EDIT_ADDRESS: {
      const { address: payloadAddress } = action.payload;

      const updatedAddressList = state.addressList.map((singleAddress) => {
        if (singleAddress.addressId === payloadAddress.addressId) {
          return { ...payloadAddress };
        } else {
          return singleAddress;
        }
      });

      return {
        ...state,
        addressList: updatedAddressList,
      };
    }

    case PRODUCTS_ACTION.DELETE_ALL_ADDRESS: {
      return {
        ...state,
        addressList: [],
      };
    }

    default:
      throw new Error(`${action.type} does not exist`);
  }
};