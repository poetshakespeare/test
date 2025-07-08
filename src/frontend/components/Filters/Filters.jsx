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

  // FUNCIÓN MEJORADA PARA MANEJAR EL SLIDER DE PRECIOS
  const handlePriceSliderChange = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    let adjustedValue = [...newValue];

    // Asegurar distancia mínima entre los valores
    if (activeThumb === 0) {
      adjustedValue[0] = Math.min(
        newValue[0],
        adjustedValue[1] - MIN_DISTANCE_BETWEEN_THUMBS
      );
    } else {
      adjustedValue[1] = Math.max(
        newValue[1],
        adjustedValue[0] + MIN_DISTANCE_BETWEEN_THUMBS
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

  // CALCULAR VALORES PARA EL SLIDER
  const priceStep = Math.max(1, Math.floor((maxPriceFromContext - minPriceFromContext) / 100));
  const midPriceValue = midValue(minPriceFromContext, maxPriceFromContext);

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
            <strong>Rango actual:</strong> {formatPrice(priceFromContext[0])} - {formatPrice(priceFromContext[1])}
          </p>
          <p>
            <strong>Productos disponibles:</strong> {formatPrice(minPriceFromContext)} - {formatPrice(maxPriceFromContext)}
          </p>
        </div>

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
            width: '85%',
            margin: '1rem auto',
          }}
          marks={[
            {
              value: minPriceFromContext,
              label: formatPrice(minPriceFromContext),
            },
            {
              value: midPriceValue,
              label: formatPrice(midPriceValue),
            },
            {
              value: maxPriceFromContext,
              label: formatPrice(maxPriceFromContext),
            },
          ]}
        />

        <div className={styles.flexSpaceBtwn}>
          <span>{formatPrice(minPriceFromContext)}</span>
          <span>{formatPrice(midPriceValue)}</span>
          <span>{formatPrice(maxPriceFromContext)}</span>
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