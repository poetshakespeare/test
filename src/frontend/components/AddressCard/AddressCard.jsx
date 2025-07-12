import { useAllProductsContext } from '../../contexts/ProductsContextProvider';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import { SERVICE_TYPES } from '../../constants/constants';
import styles from './AddressCard.module.css';

const AddressCard = ({
  singleAddress,
  updateActiveFormId: updateActiveFormIdProp,
}) => {
  const {
    addressId,
    username,
    mobile,
    serviceType,
    zone,
    addressInfo,
    receiverName,
    receiverPhone,
    additionalInfo,
  } = singleAddress;

  const { deleteAddressDispatch, timedMainPageLoader } =
    useAllProductsContext();

  const { storeConfig } = useConfigContext();
  const SANTIAGO_ZONES = storeConfig.zones || [];

  const handleDelete = async () => {
    await timedMainPageLoader();
    deleteAddressDispatch(addressId);
  };

  const isHomeDelivery = serviceType === SERVICE_TYPES.HOME_DELIVERY;
  const zoneName = isHomeDelivery ? SANTIAGO_ZONES.find(z => z.id === zone)?.name : '';

  return (
    <article className={styles.addressCard}>
      <h3>{username}</h3>
      <div className={styles.row}>
        <span>Móvil: {mobile}</span>
      </div>

      <p><strong>Servicio:</strong> {isHomeDelivery ? 'Entrega a domicilio' : 'Recoger en local'}</p>

      {isHomeDelivery ? (
        <>
          <p><strong>Zona:</strong> {zoneName}</p>
          <p><strong>Dirección:</strong> {addressInfo}</p>
          <p><strong>Recibe:</strong> {receiverName}</p>
          <p><strong>Teléfono:</strong> {receiverPhone}</p>
        </>
      ) : (
        additionalInfo && <p><strong>Información adicional:</strong> {additionalInfo}</p>
      )}

      <div className='btn-container'>
        <button
          className='btn btn-success'
          onClick={() => updateActiveFormIdProp(addressId)}
        >
          Editar
        </button>
        <button onClick={handleDelete} className='btn btn-danger'>
          Eliminar
        </button>
      </div>
    </article>
  );
};

export default AddressCard;