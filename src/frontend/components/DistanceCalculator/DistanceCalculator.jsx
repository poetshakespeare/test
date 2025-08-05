import React, { useState, useEffect } from 'react';
import { getUserLocation, calculateTripToStore, STORE_COORDINATES } from '../../utils/distanceCalculator';
import { toastHandler } from '../../utils/utils';
import { ToastType } from '../../constants/constants';
import styles from './DistanceCalculator.module.css';

const DistanceCalculator = ({ onDistanceCalculated }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [tripInfo, setTripInfo] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const calculateDistance = async () => {
    setIsCalculating(true);
    setLocationError(null);

    try {
      toastHandler(ToastType.Info, '📍 Obteniendo tu ubicación...');
      
      const userLocation = await getUserLocation();
      const tripData = calculateTripToStore(userLocation);
      
      setTripInfo(tripData);
      
      // Notificar al componente padre
      if (onDistanceCalculated) {
        onDistanceCalculated(tripData);
      }
      
      toastHandler(ToastType.Success, `📏 Distancia calculada: ${tripData.distance}`);
      
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      setLocationError(error.message);
      toastHandler(ToastType.Error, `❌ ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // Calcular automáticamente al montar el componente
  useEffect(() => {
    calculateDistance();
  }, []);

  return (
    <div className={styles.distanceCalculator}>
      <div className={styles.header}>
        <h4>📍 Calculadora de Distancia y Tiempo</h4>
        <button 
          onClick={calculateDistance}
          disabled={isCalculating}
          className={`btn btn-primary ${styles.calculateBtn}`}
        >
          {isCalculating ? (
            <span className={styles.loading}>
              <span className="loader-2"></span>
              Calculando...
            </span>
          ) : (
            '🔄 Recalcular'
          )}
        </button>
      </div>

      {locationError && (
        <div className={styles.errorMessage}>
          <p>❌ {locationError}</p>
          <small>💡 Permite el acceso a tu ubicación para calcular la distancia</small>
        </div>
      )}

      {tripInfo && (
        <div className={styles.tripInfo}>
          <div className={styles.distanceCard}>
            <h5>📏 Distancia hasta la tienda</h5>
            <div className={styles.distanceValue}>{tripInfo.distance}</div>
          </div>

          <div className={styles.timeEstimates}>
            <h5>⏱️ Tiempo estimado de viaje:</h5>
            <div className={styles.timeGrid}>
              <div className={styles.timeItem}>
                <span className={styles.icon}>{tripInfo.walking.icon}</span>
                <span className={styles.method}>{tripInfo.walking.description}</span>
                <span className={styles.time}>{tripInfo.walking.time}</span>
              </div>
              <div className={styles.timeItem}>
                <span className={styles.icon}>{tripInfo.bicycle.icon}</span>
                <span className={styles.method}>{tripInfo.bicycle.description}</span>
                <span className={styles.time}>{tripInfo.bicycle.time}</span>
              </div>
              <div className={styles.timeItem}>
                <span className={styles.icon}>{tripInfo.electricBike.icon}</span>
                <span className={styles.method}>{tripInfo.electricBike.description}</span>
                <span className={styles.time}>{tripInfo.electricBike.time}</span>
              </div>
              <div className={styles.timeItem}>
                <span className={styles.icon}>{tripInfo.motorcycle.icon}</span>
                <span className={styles.method}>{tripInfo.motorcycle.description}</span>
                <span className={styles.time}>{tripInfo.motorcycle.time}</span>
              </div>
              <div className={styles.timeItem}>
                <span className={styles.icon}>{tripInfo.car.icon}</span>
                <span className={styles.method}>{tripInfo.car.description}</span>
                <span className={styles.time}>{tripInfo.car.time}</span>
              </div>
            </div>
          </div>

          <div className={styles.navigationLinks}>
            <h5>🗺️ Abrir en aplicaciones de navegación:</h5>
            <div className={styles.navButtons}>
              <a
                href={tripInfo.mapLinks.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navButton}
              >
                🗺️ Google Maps
              </a>
              <a
                href={tripInfo.mapLinks.appleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navButton}
              >
                🍎 Apple Maps
              </a>
              <a
                href={tripInfo.mapLinks.waze}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navButton}
              >
                🚗 Waze
              </a>
            </div>
          </div>
        </div>
      )}

      <div className={styles.storeInfo}>
        <h5>🏪 Ubicación de la tienda:</h5>
        <p>{STORE_COORDINATES.address}</p>
        <p>📍 {STORE_COORDINATES.lat}, {STORE_COORDINATES.lng}</p>
      </div>
    </div>
  );
};

export default DistanceCalculator;