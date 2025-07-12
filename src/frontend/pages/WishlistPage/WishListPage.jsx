import { ProductCard, Title } from '../../components';
import EmptyList from '../../components/EmptyList/EmptyList';
import { ToastType } from '../../constants/constants';
import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { toastHandler } from '../../utils/utils';
import styles from './WishlistPage.module.css';

const WishListPage = () => {
  const { wishlist: wishlistFromContext, clearWishlistDispatch } =
    useAllProductsContext();

  const handleClearWishlist = () => {
    clearWishlistDispatch();
    toastHandler(ToastType.Success, 'Lista de deseos limpiada exitosamente');
  };

  if (wishlistFromContext.length < 1) {
    return <EmptyList listName='lista de deseos' />;
  }

  return (
    <main className={`full-page ${styles.wishlistPage}`}>
      <Title>Lista de Deseos ({wishlistFromContext.length})</Title>

      <div className={`container ${styles.wishlistsContainer}`}>
        {wishlistFromContext.map((singleWishItem) => (
          <ProductCard key={singleWishItem._id} product={singleWishItem} />
        ))}
      </div>

      {/* made a api in wishlist controller for this functionality. */}
      <button
        className='btn btn-danger btn-padding-desktop btn-center mt-2'
        onClick={handleClearWishlist}
      >
        Limpiar Lista de Deseos
      </button>
    </main>
  );
};

export default WishListPage;