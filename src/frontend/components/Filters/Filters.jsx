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
        <div>
          <MdClose onClick={handleFilterToggle} />
        </div>
      )}

      <header>
        <p>Filtros</p>
        <button className='btn btn-danger' onClick={handleClearFilter}>
          Limpiar Filtros
        </button>
      </header>

      <fieldset>
        <legend>💰 Rango de Precio</legend>
        
        <div className={styles.priceInfo}>
          <p>
            <strong>Rango seleccionado:</strong> {formatPrice(priceFromContext[0])} - {formatPrice(priceFromContext[1])}
          </p>
          <p>
            <strong>Productos disponibles:</strong> {formatPrice(minPriceFromContext)} - {formatPrice(maxPriceFromContext)}
          </p>
          <p className={styles.priceHint}>
            💡 Arrastra los controles para ajustar el rango de precios
          </p>
        </div>

        <div className={styles.sliderContainer}>
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
            style={{
              color: 'var(--primary-500)',
              width: '100%',
              margin: '1.5rem 0',
            }}
            marks={getSliderMarks()}
            sx={{
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgba(59, 130, 246, 0.16)',
                },
              },
              '& .MuiSlider-track': {
                height: 6,
              },
              '& .MuiSlider-rail': {
                height: 6,
                opacity: 0.3,
              },
              '& .MuiSlider-mark': {
                backgroundColor: 'var(--primary-300)',
                height: 8,
                width: 2,
              },
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem',
                color: 'var(--grey-600)',
                fontWeight: 500,
              },
              '& .MuiSlider-valueLabel': {
                backgroundColor: 'var(--primary-600)',
                fontSize: '0.8rem',
                fontWeight: 600,
              },
            }}
          />
        </div>

        <div className={styles.priceInputs}>
          <div className={styles.priceInputGroup}>
            <label>Precio mínimo:</label>
            <input
              type="number"
              value={priceFromContext[0]}
              onChange={(e) => {
                const newMin = Math.max(minPriceFromContext, parseInt(e.target.value) || minPriceFromContext);
                const newMax = Math.max(newMin + priceStep, priceFromContext[1]);
                handlePriceSliderChange(null, [newMin, newMax], 0);
              }}
              className={styles.priceInput}
              min={minPriceFromContext}
              max={priceFromContext[1] - priceStep}
              step={priceStep}
            />
          </div>
          <div className={styles.priceInputGroup}>
            <label>Precio máximo:</label>
            <input
              type="number"
              value={priceFromContext[1]}
              onChange={(e) => {
                const newMax = Math.min(maxPriceFromContext, parseInt(e.target.value) || maxPriceFromContext);
                const newMin = Math.min(newMax - priceStep, priceFromContext[0]);
                handlePriceSliderChange(null, [newMin, newMax], 1);
              }}
              className={styles.priceInput}
              min={priceFromContext[0] + priceStep}
              max={maxPriceFromContext}
              step={priceStep}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>📂 Categoría</legend>

        {categoriesList.length === 0 ? (
          <p className={styles.noOptions}>No hay categorías disponibles</p>
        ) : (
          categoriesList.map((singleCategory, index) => (
            <div key={index}>
              <input
                type='checkbox'
                name={FILTER_INPUT_TYPE.CATEGORY}
                id={giveUniqueLabelFOR(singleCategory, index)}
                checked={categoryFromContext[singleCategory] || false}
                onChange={() => updateCategoryFilter(singleCategory)}
              />{' '}
              <label htmlFor={giveUniqueLabelFOR(singleCategory, index)}>
                {singleCategory}
              </label>
            </div>
          ))
        )}
      </fieldset>

      <fieldset>
        <legend>🏢 Marca</legend>

        <select
          name={FILTER_INPUT_TYPE.COMPANY}
          onChange={updateFilters}
          value={companyFromContext}
        >
          <option value='all'>Todas las marcas</option>
          {companiesList.map((company, index) => (
            <option key={giveUniqueLabelFOR(company, index)} value={company}>
              {company}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className={styles.ratingFieldset}>
        <legend>⭐ Calificación</legend>

        {RATINGS.map((singleRating, index) => (
          <div key={singleRating}>
            <input
              type='radio'
              name={FILTER_INPUT_TYPE.RATING}
              data-rating={singleRating}
              onChange={updateFilters}
              id={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}
              checked={singleRating === ratingFromContext}
            />{' '}
            <label htmlFor={giveUniqueLabelFOR(`${singleRating} estrellas`, index)}>
              {singleRating} <FaStar /> y más
            </label>
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>🔄 Ordenar Por</legend>

        {Object.values(SORT_TYPE).map((singleSortValue, index) => (
          <div key={singleSortValue}>
            <input
              type='radio'
              name={FILTER_INPUT_TYPE.SORT}
              data-sort={singleSortValue}
              onChange={updateFilters}
              id={giveUniqueLabelFOR(singleSortValue, index)}
              checked={singleSortValue === sortByOptionFromContext}
            />{' '}
            <label htmlFor={giveUniqueLabelFOR(singleSortValue, index)}>
              {singleSortValue}
            </label>
          </div>
        ))}
      </fieldset>
    </form>
  );
};

export default Filters;