import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSingleProductService } from '../../Services/services';
import styles from './SingleProductPage.module.css';
import { Error, Price } from '../../components';
import {
  LOGIN_TOAST,
  calculateDiscountPercent,
  isPresent,
  getProductBankTransferInfo,
} from '../../utils/utils';
import { AiFillCheckCircle, AiFillStar } from 'react-icons/ai';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useCurrencyContext } from '../../contexts/CurrencyContextProvider';
import { useAuthContext } from '../../contexts/AuthContextProvider';

const SingleProductPage = () => {
  const { productId } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPriceWithCode } = useCurrencyContext();

  const {
    wishlist: wishlistFromContext,
    cart: cartFromContext,
    showMainPageLoader,
    hideMainPageLoader,
    addToCartDispatch,
    addToWishlistDispatch,
  } = useAllProductsContext();

  const [singleProductState, setSingleProductState] = useState({
    isSinglePageLoading: true,
    singleProductData: [],
    isSinglePageError: false,
  });

  const [activeColorObj, setActiveColorObj] = useState(null);
  const [isWishlistBtnDisable, setIsWishlistBtnDisable] = useState(false);
  const [isCartBtnDisable, setIsCartBtnDisable] = useState(false);

  const fetchSingleProduct = async () => {
    setSingleProductState({ ...singleProductState, isSinglePageLoading: true });

    showMainPageLoader();

    try {
      const product = await getSingleProductService(productId);

      hideMainPageLoader();
      setSingleProductState({
        isSinglePageLoading: false,
        singleProductData: product,
        isSinglePageError: false,
      });
      setActiveColorObj(product?.colors[0]);
    } catch (error) {
      console.error(error.response);

      hideMainPageLoader();

      setSingleProductState({
        ...singleProductState,
        isSinglePageLoading: false,
        isSinglePageError: true,
      });
    }
  };

  useEffect(() => {
    fetchSingleProduct();
    // eslint-disable-next-line
  }, [productId]);

  // if the user is in single product page (of oneplus 10R), clicks on the suggestions Link (eg oneplus air 2020), only the productId in the url of singleProductPage changes but as the singleProductPage was already mounted, it doesnot fetch again the new product, so added productId in the dependency list

  const { isSinglePageLoading, singleProductData, isSinglePageError } =
    singleProductState;

  if (isSinglePageLoading) {
    return <main className='full-page'></main>;
  }

  if (isSinglePageError) {
    return <Error errorText='Error: Producto No Encontrado' />;
  }

  const {
    _id: singlePageProductId,
    name,
    price,
    originalPrice,
    image,
    colors,
    company,
    description,
    category,
    isShippingAvailable,
    stock,
    reviewCount,
    stars,
  } = singleProductData;

  // Obtener información de transferencia bancaria
  const bankTransferInfo = getProductBankTransferInfo(singleProductData);
  const bankTransferEnabled = bankTransferInfo.isEnabled;
  const productBankTransferSurcharge = bankTransferInfo.surchargePercent;
  const bankTransferAmount = bankTransferInfo.surchargeAmount;
  const totalWithBankTransfer = bankTransferInfo.totalWithSurcharge;

  const discountPercent = calculateDiscountPercent(price, originalPrice);
  const inStock = stock > 0;

  const isSinglePageProductInCart = isPresent(
    `${singlePageProductId}${activeColorObj?.color}`,
    cartFromContext
  );

  const isSinglePageProductInWishlist = isPresent(
    `${singlePageProductId}${activeColorObj?.color}`,
    wishlistFromContext
  );

  const handleCartBtnClick = async () => {
    if (!user) {
      LOGIN_TOAST();
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isSinglePageProductInCart) {
      navigate('/cart');
      return;
    }

    setIsCartBtnDisable(true);
    await addToCartDispatch({
      ...singleProductData,
      _id: `${singleProductData._id}${activeColorObj.color}`,
      colors: [activeColorObj],
    });
    setIsCartBtnDisable(false);
  };

  const handleWishlistBtnClick = async () => {
    if (!user) {
      LOGIN_TOAST();
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isSinglePageProductInWishlist) {
      navigate('/wishlist');
      return;
    }

    setIsWishlistBtnDisable(true);
    await addToWishlistDispatch({
      ...singleProductData,
      _id: `${singleProductData._id}${activeColorObj.color}`,
      colors: [activeColorObj],
    });
    setIsWishlistBtnDisable(false);
  };

  const handleColorClick = (colorData) => setActiveColorObj(colorData);

  return (
    <main className={`container half-page ${styles.productPageCenter}`}>
      <div className={styles.imageContainer}>
        <img src={image} alt={name} />
      </div>

      <div className={styles.productContent}>
        <h3 className='primary-color-text'>{name}</h3>
        <div className={styles.userReview}>
          <span className={styles.rating}>
            {stars} <AiFillStar />
          </span>
          <p>({reviewCount} reseñas de clientes)</p>
        </div>

        <div className={styles.price}>
          <Price amount={price} />
          {discountPercent > 0 && (
            <>
              <Price amount={originalPrice} />
              <span className={styles.discount}> ({discountPercent}% desc.)</span>
            </>
          )}
        </div>

        <p className={styles.desc}>{description}</p>

        <div className={styles.row}>
          <span>Disponibilidad:</span>
          <p>{inStock ? 'En Stock' : 'Agotado'}</p>
        </div>

        <div className={styles.row}>
          <span>Envío Disponible:</span>
          <p>{isShippingAvailable ? 'Sí' : 'No'}</p>
        </div>

        <div className={styles.row}>
          <span>Categoría:</span>
          <p>{category}</p>
        </div>

        <div className={styles.row}>
          <span>Marca:</span>
          <p>{company}</p>
        </div>

        <div className={styles.row}>
          <span>Color{colors.length > 1 && 'es'}:</span>

          <div
            className={
              inStock
                ? styles.colorsContainer
                : `${styles.colorsContainer} ${styles.cursorDefault}`
            }
          >
            {colors.map((colorObj, index) => (
              <div
                {...(inStock && { onClick: () => handleColorClick(colorObj) })}
                key={index}
                style={{ background: colorObj.color }}
              >
                {colorObj.color === activeColorObj.color && inStock && (
                  <AiFillCheckCircle />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <span>Stock Disponible:</span>
          <p>{activeColorObj.colorQuantity}</p>
        </div>

        {bankTransferEnabled && (
          <div className={styles.bankTransferInfo}>
            <h4>🏦 Información de Transferencia Bancaria</h4>
            <div className={styles.bankTransferDetails}>
              <div className={styles.bankTransferRow}>
                <span>💵 Precio en efectivo:</span>
                <Price amount={price} />
              </div>
              <div className={styles.bankTransferRow}>
                <span>🏦 Recargo por transferencia ({productBankTransferSurcharge}%):</span>
                <span className={styles.surchargeAmount}>+{formatPriceWithCode(bankTransferAmount)}</span>
              </div>
              <div className={`${styles.bankTransferRow} ${styles.totalRow}`}>
                <span>💰 Total por transferencia bancaria:</span>
                <span className={styles.totalAmount}>{formatPriceWithCode(totalWithBankTransfer)}</span>
              </div>
            </div>
            <div className={styles.bankTransferNote}>
              <span className={styles.noteIcon}>ℹ️</span>
              <span className={styles.noteText}>
                Este producto tiene un recargo del {productBankTransferSurcharge}% cuando se paga por transferencia bancaria. 
                El recargo se aplica automáticamente al seleccionar este método de pago en el checkout.
              </span>
            </div>
          </div>
        )}

        <hr />

        <div className='btn-container'>
          <button
            className={`btn btn-padding-desktop ${
              isSinglePageProductInCart && 'btn-activated'
            }`}
            disabled={!inStock || isCartBtnDisable}
            onClick={handleCartBtnClick}
          >
            {isSinglePageProductInCart ? 'Ir al Carrito' : 'Agregar al Carrito'}
          </button>

          <button
            onClick={handleWishlistBtnClick}
            className={`btn btn-hipster btn-padding-desktop ${
              isSinglePageProductInWishlist && 'btn-hipster-activated'
            }`}
            disabled={!inStock || isWishlistBtnDisable}
          >
            {isSinglePageProductInWishlist
              ? 'Ir a Lista de Deseos'
              : 'Agregar a Lista de Deseos'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default SingleProductPage;