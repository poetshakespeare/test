import { SERVICE_TYPES } from '../../constants/constants';
import { useConfigContext } from '../../contexts/ConfigContextProvider';
import Price from '../Price';
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
    additionalInfo,
    paymentMethod,
    bankTransferFee,
    totalWithPaymentMethod
  } = singleAddress;

  const isActiveAddress = addressId === activeAddressId;
  const isHomeDelivery = serviceType === SERVICE_TYPES.HOME_DELIVERY;
  const zoneName = isHomeDelivery ? SANTIAGO_ZONES.find(z => z.id === zone)?.name : '';
  const isUsingBankTransfer = paymentMethod === 'bank_transfer';

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
        
        {/* Información del método de pago */}
        <div className={styles.paymentInfo}>
          <p><strong>💳 Método de pago:</strong> 
            <span className={`${styles.paymentMethod} ${isUsingBankTransfer ? styles.bankTransfer : styles.cash}`}>
              {isUsingBankTransfer ? '🏦 Transferencia Bancaria' : '💰 Pago en Efectivo'}
            </span>
          </p>
          {isUsingBankTransfer && bankTransferFee > 0 && (
            <p className={styles.bankFeeInfo}>
              <strong>⚠️ Recargo (+20%):</strong> 
              <span className={styles.feeAmount}>
                +<Price amount={bankTransferFee} showCurrencyCode={true} />
              </span>
            </p>
          )}
          {totalWithPaymentMethod > 0 && (
            <p className={styles.totalWithPayment}>
              <strong>💰 Total con método de pago:</strong> 
              <span className={styles.totalAmount}>
                <Price amount={totalWithPaymentMethod} showCurrencyCode={true} />
              </span>
            </p>
          )}
        </div>
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