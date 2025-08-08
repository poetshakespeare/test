import { SERVICE_TYPES } from '../../constants/constants';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import styles from './CheckoutAddressCard.module.css';

const CheckoutAddressCard = ({
  singleAddress,
  activeAddressId,
  handleSelect,
}) => {
  const { storeConfig } = useConfigContext();
  const SANTIAGO_ZONES = storeConfig.zones || [];
  
  const { 
    addressId, 
    username, 
    serviceType, 
    zone, 
    addressInfo, 
    mobile,
    receiverName,
    receiverPhone,
    additionalInfo 
  } = singleAddress;

  const isActiveAddress = addressId === activeAddressId;
  const isHomeDelivery = serviceType === SERVICE_TYPES.HOME_DELIVERY;
  const zoneName = isHomeDelivery ? SANTIAGO_ZONES.find(z => z.id === zone)?.name : '';

  return (
    <article
      className={
        isActiveAddress
          ? `${styles.addressCard} ${styles.selected}`
          : styles.addressCard
      }
    >
      <label htmlFor={addressId}>
        <h4 className='bold'>{username}</h4>
        <p><strong>Servicio:</strong> {isHomeDelivery ? 'Entrega a domicilio' : 'Recoger en local'}</p>
        
        {isHomeDelivery ? (
          <>
            <p><strong>Zona:</strong> {zoneName}</p>
            <p><strong>Dirección:</strong> {addressInfo}</p>
            <p><strong>Recibe:</strong> {receiverName}</p>
            <p><strong>Teléfono:</strong> {receiverPhone}</p>
          </>
        ) : (
          additionalInfo && <p><strong>Info adicional:</strong> {additionalInfo}</p>
        )}
        
        <p><strong>Móvil contacto:</strong> {mobile}</p>
      </label>

      <input
        className={styles.radio}
        type='radio'
        name='address'
        id={addressId}
        checked={isActiveAddress}
        onChange={() => handleSelect(addressId)}
      />
    </article>
  );
};

export default CheckoutAddressCard;