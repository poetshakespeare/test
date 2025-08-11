import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import ProductCard from '../ProductCard/ProductCard';
import Title from '../Title/Title';
import styles from './FeaturedProducts.module.css';
import { useEffect } from 'react';

const FeaturedProducts = () => {
  const { products: productsFromContext } = useAllProductsContext();

  // ESCUCHAR EVENTOS DE SINCRONIZACIÓN DE PRODUCTOS DESTACADOS
  useEffect(() => {
    const handleProductSync = (event) => {
      const { type } = event.detail;
      if (type === 'products') {
        console.log('📡 Sincronización de productos destacados detectada');
        // Los productos se actualizarán automáticamente a través del contexto
      }
    };

    window.addEventListener('adminPanelSync', handleProductSync);

    return () => {
      window.removeEventListener('adminPanelSync', handleProductSync);
    };
  }, []);
  const featuredProductsList = productsFromContext.filter(
    (product) => product?.featured
  );

  return (
    <section className='section'>
      <Title>Productos Destacados</Title>

      <div className={`container ${styles.featuredCenter}`}>
        {featuredProductsList.map((singleProduct) => (
          <ProductCard key={singleProduct._id} product={singleProduct} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;