import { SORT_TYPE } from '../constants/constants';
import { FILTERS_ACTION } from '../utils/actions';
import {
  convertArrayToObjectWithPropertyFALSE,
  givePaginatedList,
  lowerizeAndCheckIncludes,
} from '../utils/utils';

export const initialFiltersState = {
  allProducts: [],
  filteredProducts: [],
  minPrice: 0,
  maxPrice: Infinity,
  filters: {
    search: '',
    category: null,
    company: 'all',
    price: [0, 0],
    rating: -1,
    sortByOption: '',
  },
  paginateIndex: 0,
  displayableProductsLength: 0,
};

// FUNCIÓN MEJORADA PARA CALCULAR RANGOS DE PRECIO DINÁMICOS Y AMIGABLES
const calculatePriceRange = (products) => {
  if (!products || products.length === 0) {
    return { minPrice: 0, maxPrice: 100000 };
  }

  const prices = products.map(({ price }) => price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  console.log(`📊 Precios originales: ${minPrice} - ${maxPrice} CUP`);
  
  // Función para redondear hacia abajo a números "amigables"
  const roundDownToFriendly = (value) => {
    if (value <= 100) return Math.floor(value / 10) * 10; // Redondear a decenas
    if (value <= 1000) return Math.floor(value / 100) * 100; // Redondear a centenas
    if (value <= 10000) return Math.floor(value / 1000) * 1000; // Redondear a miles
    if (value <= 100000) return Math.floor(value / 5000) * 5000; // Redondear a 5 miles
    return Math.floor(value / 10000) * 10000; // Redondear a 10 miles
  };

  // Función para redondear hacia arriba a números "amigables"
  const roundUpToFriendly = (value) => {
    if (value <= 100) return Math.ceil(value / 10) * 10; // Redondear a decenas
    if (value <= 1000) return Math.ceil(value / 100) * 100; // Redondear a centenas
    if (value <= 10000) return Math.ceil(value / 1000) * 1000; // Redondear a miles
    if (value <= 100000) return Math.ceil(value / 5000) * 5000; // Redondear a 5 miles
    return Math.ceil(value / 10000) * 10000; // Redondear a 10 miles
  };

  // Aplicar redondeo amigable
  const adjustedMin = Math.max(0, roundDownToFriendly(minPrice));
  const adjustedMax = roundUpToFriendly(maxPrice);
  
  console.log(`📊 Rango de precios ajustado: ${adjustedMin} - ${adjustedMax} CUP`);
  
  return {
    minPrice: adjustedMin,
    maxPrice: adjustedMax
  };
};

export const filtersReducer = (state, action) => {
  switch (action.type) {
    case FILTERS_ACTION.GET_PRODUCTS_FROM_PRODUCT_CONTEXT:
      const allProductsCloned = structuredClone(action.payload?.products);
      
      // CÁLCULO DINÁMICO DE RANGOS DE PRECIO MEJORADO Y AMIGABLE
      const { minPrice, maxPrice } = calculatePriceRange(allProductsCloned);

      const filteredProducts = givePaginatedList(allProductsCloned);

      const allCategoryNames = action.payload?.categories
        .filter(category => !category.disabled) // Solo categorías habilitadas
        .map(({ categoryName }) => categoryName);

      return {
        ...state,
        allProducts: allProductsCloned,
        filteredProducts,
        minPrice,
        maxPrice,
        filters: {
          ...state.filters,
          category: convertArrayToObjectWithPropertyFALSE(allCategoryNames),
          price: [minPrice, maxPrice],
        },
        displayableProductsLength: allProductsCloned.length,
      };

    case FILTERS_ACTION.UPDATE_CATEGORY:
      return {
        ...state,
        filters: {
          ...state.filters,
          category: {
            ...state.filters.category,
            [action.payloadCategory]:
              !state.filters.category[action.payloadCategory],
          },
        },
      };

    case FILTERS_ACTION.UPDATE_SEARCH_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          search: action.payloadSearch,
        },
      };

    case FILTERS_ACTION.UPDATE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.payloadName]: action.payload.payloadValue,
        },
        paginateIndex: 0,
      };

    case FILTERS_ACTION.CHECK_CATEGORY:
      return {
        ...state,
        filters: {
          ...state.filters,
          category: {
            ...state.filters.category,
            [action.payloadCategory]: true,
          },
        },
      };

    case FILTERS_ACTION.CLEAR_FILTERS:
      const { category } = state.filters;
      const allUncheckedCategoryObj = convertArrayToObjectWithPropertyFALSE(
        Object.keys(category)
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          search: '',
          category: allUncheckedCategoryObj,
          company: 'all',
          price: [state.minPrice, state.maxPrice],
          rating: -1,
          sortByOption: '',
        },
        paginateIndex: 0,
      };

    case FILTERS_ACTION.UPDATE_PAGINATION:
      return {
        ...state,
        paginateIndex: action.payloadIndex,
      };

    case FILTERS_ACTION.APPLY_FILTERS:
      const { allProducts, filters } = state;

      const {
        search: searchText,
        category: categoryObjInState,
        company: companyInState,
        price: priceInState,
        rating: ratingInState,
        sortByOption,
      } = filters;

      const isAnyCheckboxChecked = Object.values(categoryObjInState).some(
        (categoryBool) => categoryBool
      );

      let tempProducts = allProducts;

      // FILTRO DE BÚSQUEDA MEJORADO
      tempProducts = allProducts.filter(({ name, description, company, category }) => {
        const trimmedSearchText = searchText.trim();
        if (!trimmedSearchText) return true;
        
        return (
          lowerizeAndCheckIncludes(name, trimmedSearchText) ||
          lowerizeAndCheckIncludes(description || '', trimmedSearchText) ||
          lowerizeAndCheckIncludes(company, trimmedSearchText) ||
          lowerizeAndCheckIncludes(category, trimmedSearchText)
        );
      });

      // FILTRO DE CATEGORÍA
      if (isAnyCheckboxChecked) {
        tempProducts = tempProducts.filter(
          ({ category: categoryPropertyOfProduct }) =>
            categoryObjInState[categoryPropertyOfProduct]
        );
      }

      // FILTRO DE MARCA
      if (companyInState !== 'all') {
        tempProducts = tempProducts.filter(
          ({ company: companyPropertyOfProduct }) =>
            companyPropertyOfProduct === companyInState
        );
      }

      // FILTRO DE PRECIO MEJORADO CON VALIDACIÓN
      tempProducts = tempProducts.filter(
        ({ price: pricePropertyOfProduct }) => {
          const [currMinPriceRange, currMaxPriceRange] = priceInState;
          return (
            pricePropertyOfProduct >= currMinPriceRange &&
            pricePropertyOfProduct <= currMaxPriceRange
          );
        }
      );

      // FILTRO DE CALIFICACIÓN
      if (ratingInState > -1) {
        tempProducts = tempProducts.filter(({ stars }) => stars >= ratingInState);
      }

      // ORDENAMIENTO MEJORADO
      if (!!sortByOption) {
        switch (sortByOption) {
          case SORT_TYPE.PRICE_LOW_TO_HIGH: {
            tempProducts = [...tempProducts].sort((a, b) => a.price - b.price);
            break;
          }

          case SORT_TYPE.PRICE_HIGH_TO_LOW: {
            tempProducts = [...tempProducts].sort((a, b) => b.price - a.price);
            break;
          }

          case SORT_TYPE.NAME_A_TO_Z: {
            tempProducts = [...tempProducts].sort((a, b) => {
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            break;
          }

          case SORT_TYPE.NAME_Z_TO_A: {
            tempProducts = [...tempProducts].sort((a, b) => {
              return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
            });
            break;
          }

          default:
            console.warn(`Tipo de ordenamiento no reconocido: ${sortByOption}`);
        }
      }

      // PAGINACIÓN
      const paginatedProducts = givePaginatedList(tempProducts);

      console.log(`🔍 Filtros aplicados: ${tempProducts.length} productos encontrados`);

      return {
        ...state,
        filteredProducts: paginatedProducts,
        displayableProductsLength: tempProducts.length,
        paginateIndex: 0,
      };

    default:
      throw new Error(`Error: ${action.type} en filtersReducer no existe`);
  }
};