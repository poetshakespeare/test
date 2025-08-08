import { useAllProductsContext } from '../../contexts/ProductsContextProvider';

const Order = () => {
  const { orderDetails: orderDetailsFromContext } = useAllProductsContext();
  console.log({ orderDetailsFromContext });
  return <section>OrderPage</section>;
};

export default Order;
