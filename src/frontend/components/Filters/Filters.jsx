import { FaStar } from 'react-icons/fa';
import { giveUniqueLabelFOR, midValue, toastHandler } from '../../utils/utils';
import styles from './Filters.module.css';

import { useFiltersContext } from '../../contexts/FiltersContextProvider';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { MdClose } from 'react-icons/md';
import {
  FILTER_INPUT_TYPE,
  SORT_TYPE,
  ToastType,
  RATINGS,
  MIN_DISTANCE_BETWEEN_THUMBS,
} from '../../constants/constants';
import { Slider } from '@mui/material';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';

const Filters = ({
  isFilterContainerVisible,
  handleFilterToggle,
  isMobile,
}) => {
  const {
    minPrice: minPriceFromContext,
    maxPrice: maxPriceFromContext,
    filters,
    updateFilters,
    updatePriceFilter,
    updateCategoryFilter,
    clearFilters,
  } = useFiltersContext();

  const { products: productsFromProductContext } = useAllProductsContext();
  const { formatPrice } = useCurrencyContext();

  const {
    category: categoryFromContext,
    company: companyFromContext,
    price: priceFromContext,
    rating: ratingFromContext,
    sortByOption: sortByOptionFromContext,
  } = filters;

  // FILTRAR SOLO CATEGORÍAS HABILITADAS
  const categoriesList = [
    ...new Set(
      productsFromProductContext
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  const companiesList = [
    ...new Set(
      productsFromProductContext
        .map((product) => product.company)
        .filter(Boolean)
    ),
  ];

  const handleClearFilter = () => {
    clearFilters();
    toastHandler(ToastType.Success, 'Filtros limpiados exitosamente');
  };

  // FUNCIÓN MEJORADA PARA MANEJAR EL SLIDER DE PRECIOS CON MEJOR UX
  const handlePriceSliderChange = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    let adjustedValue = [...newValue];

    // Asegurar distancia mínima entre los valores (más pequeña para mejor UX)
    const minDistance = Math.min(MIN_DISTANCE_BETWEEN_THUMBS, (maxPriceFromContext - minPriceFromContext) * 0.01);
    
    if (activeThumb === 0) {
      adjustedValue[0] = Math.min(
        newValue[0],
        adjustedValue[1] - minDistance
      );
    } else {
      adjustedValue[1] = Math.max(
        newValue[1],
        adjustedValue[0] + minDistance
      );
    }

    // Asegurar que los valores estén dentro del rango válido
    adjustedValue[0] = Math.max(minPriceFromContext, adjustedValue[0]);
    adjustedValue[1] = Math.min(maxPriceFromContext, adjustedValue[1]);

    updatePriceFilter(
      { target: { name: FILTER_INPUT_TYPE.PRICE } },
      adjustedValue,
      activeThumb
    );
  };

  // CALCULAR VALORES PARA EL SLIDER CON MEJOR DISTRIBUCIÓN
  const priceRange = maxPriceFromContext - minPriceFromContext;
  const priceStep = (() => {
    if (priceRange <= 1000) return 10; // Pasos de 10 para rangos pequeños
    if (priceRange <= 10000) return 100; // Pasos de 100 para rangos medianos
    if (priceRange <= 100000) return 500; // Pasos de 500 para rangos grandes
    return 1000; // Pasos de 1000 para rangos muy grandes
  })();

  const midPriceValue = midValue(minPriceFromContext, maxPriceFromContext);

  // CALCULAR MARCAS DEL SLIDER DE FORMA INTELIGENTE
  const getSliderMarks = () => {
    const marks = [
      {
        value: minPriceFromContext,
        label: formatPrice(minPriceFromContext),
      },
      {
        value: maxPriceFromContext,
        label: formatPrice(maxPriceFromContext),
      }
    ];

    // Solo agregar marca del medio si hay suficiente espacio
    if (priceRange > 2000) {
      marks.splice(1, 0, {
        value: midPriceValue,
        label: formatPrice(midPriceValue),
      });
    }

    return marks;
  };

  return (
    <form
      className={`${styles.filtersContainer} ${
        isFilterContainerVisible && isMobile && styles.showFiltersContainer
      }`}
      onSubmit={(e) => e.preventDefault()}
    >
      {isMobile && (
        <div className={styles.mobileHeader}>
          <h3>🔍 Filtros</h3>
          <MdClose onClick={handleFilterToggle} className={styles.closeIcon} />
        </div>
      )}

      <div className={styles.filtersContent}>
        <header className={styles.filtersHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.filtersTitle}>🔍 Filtros</h3>
            <button 
              className={`btn btn-danger ${styles.clearButton}`} 
              onClick={handleClearFilter}
              type="button"
            >
              🗑️ Limpiar
            </button>
          </div>
        </header>

        {/* SECCIÓN DE PRECIO MODERNIZADA */}
        <div className={styles.modernSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💰</span>
              Rango de Precio
            </h4>
          </div>
          
          <div className={styles.priceSection}>
            <div className={styles.priceDisplay}>
              <div className={styles.priceRange}>
                <span className={styles.priceLabel}>Desde</span>
                <div className={styles.priceValue}>
                  {formatPrice(priceFromContext[0])}
                </div>
              </div>
              <div className={styles.priceSeparator}>—</div>
              <div className={styles.priceRange}>
                <span className={styles.priceLabel}>Hasta</span>
                <div className={styles.priceValue}>
                  {formatPrice(priceFromContext[1])}
                </div>
              </div>
            </div>

            <div className={styles.modernSliderContainer}>
              <Slider
                name={FILTER_INPUT_TYPE.PRICE}
                getAriaLabel={() => 'Rango de precios'}
                value={priceFromContext}
                onChange={handlePriceSliderChange}
                valueLabelDisplay='auto'
                valueLabelFormat={(value) => formatPrice(value)}
                min={minPriceFromContext}
                max={maxPriceFromContext}
                step={priceStep}
                disableSwap
                className={styles.modernSlider}
                marks={getSliderMarks()}
                sx={{
                  color: 'var(--primary-500)',
                  height: 8,
                  '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    backgroundColor: 'var(--white)',
                    border: '3px solid var(--primary-500)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                      transform: 'scale(1.1)',
                    },
                    '&:active': {
                      boxShadow: '0 0 0 12px rgba(59, 130, 246, 0.24)',
                      transform: 'scale(1.2)',
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                    background: 'linear-gradient(90deg, var(--primary-400), var(--primary-600))',
                    border: 'none',
                    borderRadius: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    backgroundColor: 'var(--grey-200)',
                    borderRadius: 4,
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: 'var(--primary-300)',
                    height: 12,
                    width: 3,
                    borderRadius: 2,
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem',
                    color: 'var(--grey-600)',
                    fontWeight: 500,
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: 'var(--primary-600)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '4px 8px',
                    '&:before': {
                      borderTopColor: 'var(--primary-600)',
                    },
                  },
                }}
              />
            </div>

            <div className={styles.priceInputs}>
              <div className={styles.priceInputGroup}>
                <label className={styles.inputLabel}>Mínimo</label>
                <input
                  type="number"
                  value={priceFromContext[0]}
                  onChange={(e) => {
                    const newMin = Math.max(minPriceFromContext, parseInt(e.target.value) || minPriceFromContext);
                    const newMax = Math.max(newMin + priceStep, priceFromContext[1]);
                    handlePriceSliderChange(null, [newMin, newMax], 0);
                  }}
                  className={styles.modernInput}
                  min={minPriceFromContext}
                  max={priceFromContext[1] - priceStep}
                  step={priceStep}
                />
              </div>
              <div className={styles.priceInputGroup}>
                <label className={styles.inputLabel}>Máximo</label>
                <input
                  type="number"
                  value={priceFromContext[1]}
                  onChange={(e) => {
                    const newMax = Math.min(maxPriceFromContext, parseInt(e.target.value) || maxPriceFromContext);
                    const newMin = Math.min(newMax - priceStep, priceFromContext[0]);
                    handlePriceSliderChange(null, [newMin, newMax], 1);
                  }}
                  className={styles.modernInput}
                  min={priceFromContext[0] + priceStep}
                  max={maxPriceFromContext}
                  step={priceStep}
                />
              </div>
            </div>

            <div className={styles.priceInfo}>
              <span className={styles.infoText}>
                💡 Rango disponible: {formatPrice(minPriceFromContext)} - {formatPrice(maxPriceFromContext)}
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE CATEGORÍAS MODERNIZADA */}
        <div className={styles.modernSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📂</span>
              Categorías
            </h4>
          </div>

          <div className={styles.categoriesGrid}>
            {categoriesList.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📂</span>
                <p>No hay categorías disponibles</p>
              </div>
            ) : (
              categoriesList.map((singleCategory, index) => (
                <div 
                  key={index} 
                  className={`${styles.categoryCard} ${
                    categoryFromContext[singleCategory] ? styles.categoryActive : ''
                  }`}
                  onClick={() => updateCategoryFilter(singleCategory)}
                >
                  <input
                    type='checkbox'
                    name={FILTER_INPUT_TYPE.CATEGORY}
                    id={giveUniqueLabelFOR(singleCategory, index)}
                    checked={categoryFromContext[singleCategory] || false}
                    onChange={() => updateCategoryFilter(singleCategory)}
                    className={styles.categoryCheckbox}
                  />
                  <label 
                    htmlFor={giveUniqueLabelFOR(singleCategory, index)}
                    className={styles.categoryLabel}
                  >
                    <span className={styles.categoryIcon}>📦</span>
                    <span className={styles.categoryName}>{singleCategory}</span>
                    <span className={styles.checkmark}>✓</span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OTRAS SECCIONES */}
        <div className={styles.modernSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🏢</span>
              Marca
            </h4>
          </div>

          <select
            name={FILTER_INPUT_TYPE.COMPANY}
            onChange={updateFilters}
            value={companyFromContext}
            className={styles.modernSelect}
          >
            <option value='all'>Todas las marcas</option>
            {companiesList.map((company, index) => (
              <option key={giveUniqueLabelFOR(company, index)} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.modernSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⭐</span>
              Calificación
            </h4>
          </div>

          <div className={styles.ratingOptions}>
            {RATINGS.map((singleRating, index) => (
              <div 
                key={singleRating} 
                className={`${styles.ratingCard} ${
                  singleRating === ratingFromContext ? styles.ratingActive : ''
                }`}
                onClick={() => updateFilters({
                  target: { 
                    name: FILTER_INPUT_TYPE.RATING, 
                    dataset: { rating: singleRating } 
                  }
                })}
              >
                <input
                  type='radio'
                  name={FILTER_INPUT_TYPE.RATING}
                  data-rating={singleRating}
                  onChange={updateFilters}
                  id={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}
                  checked={singleRating === ratingFromContext}
                  className={styles.ratingRadio}
                />
                <label 
                  htmlFor={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}
                  className={styles.ratingLabel}
                >
                  <div className={styles.starsContainer}>
                    {[...Array(5)].map((_, starIndex) => (
                      <FaStar 
                        key={starIndex}
                        className={`${styles.star} ${
                          starIndex < singleRating ? styles.starFilled : styles.starEmpty
                        }`}
                      />
                    ))}
                  </div>
                  <span className={styles.ratingText}>{singleRating} y más</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modernSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🔄</span>
              Ordenar Por
            </h4>
          </div>

          <div className={styles.sortOptions}>
            {Object.values(SORT_TYPE).map((singleSortValue, index) => (
              <div 
                key={singleSortValue} 
                className={`${styles.sortCard} ${
                  singleSortValue === sortByOptionFromContext ? styles.sortActive : ''
                }`}
                onClick={() => updateFilters({
                  target: { 
                    name: FILTER_INPUT_TYPE.SORT, 
                    dataset: { sort: singleSortValue } 
                  }
                })}
              >
                <input
                  type='radio'
                  name={FILTER_INPUT_TYPE.SORT}
                  data-sort={singleSortValue}
                  onChange={updateFilters}
                  id={giveUniqueLabelFOR(singleSortValue, index)}
                  checked={singleSortValue === sortByOptionFromContext}
                  className={styles.sortRadio}
                />
                <label 
                  htmlFor={giveUniqueLabelFOR(singleSortValue, index)}
                  className={styles.sortLabel}
                >
                  {singleSortValue}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default Filters;