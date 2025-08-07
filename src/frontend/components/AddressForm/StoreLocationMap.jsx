import React, { useState } from 'react';
import { STORE_LOCATION } from '../../constants/constants';
import { toastHandler } from '../../utils/utils';
import { ToastType } from '../../constants/constants';
import styles from './StoreLocationMap.module.css';

const StoreLocationMap = () => {
  const [distanceData, setDistanceData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Coordenadas de la tienda Yero Shop!
  const STORE_COORDINATES = {
    lat: 20.039585,
    lng: -75.849663,
    address: 'Santiago de Cuba, Cuba'
  };

  // Función para obtener la ubicación del usuario
  const getUserLocation = () => {
    setIsCalculating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está soportada en este navegador');
      setIsCalculating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        calculateDistance(userCoords);
      },
      (error) => {
        let errorMessage = 'Error al obtener tu ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
          default:
            errorMessage = 'Error desconocido al obtener ubicación';
            break;
        }
        setLocationError(errorMessage);
        setIsCalculating(false);
        toastHandler(ToastType.Warn, errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  // Función para calcular distancia usando la fórmula de Haversine
  const calculateDistance = (userCoords) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (STORE_COORDINATES.lat - userCoords.lat) * Math.PI / 180;
    const dLng = (STORE_COORDINATES.lng - userCoords.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(STORE_COORDINATES.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distancia en km

    // Calcular tiempos estimados
    const walkingSpeed = 5; // km/h
    const bicycleSpeed = 15; // km/h
    const electricBicycleSpeed = 25; // km/h
    const carSpeed = 30; // km/h en ciudad

    const walkingTime = (distance / walkingSpeed) * 60; // minutos
    const bicycleTime = (distance / bicycleSpeed) * 60; // minutos
    const electricBicycleTime = (distance / electricBicycleSpeed) * 60; // minutos
    const carTime = (distance / carSpeed) * 60; // minutos

    const distanceInfo = {
      distance: distance,
      walkingTime: Math.round(walkingTime),
      bicycleTime: Math.round(bicycleTime),
      electricBicycleTime: Math.round(electricBicycleTime),
      carTime: Math.round(carTime),
      userCoords
    };

    setDistanceData(distanceInfo);
    setIsCalculating(false);
    
    toastHandler(ToastType.Success, `📍 Distancia calculada: ${distance.toFixed(2)} km`);
  };

  // Función para formatear tiempo
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Función para generar URLs de mapas
  const generateMapUrls = () => {
    const { lat, lng } = STORE_COORDINATES;
    
    return {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      appleMaps: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    };
  };

  const mapUrls = generateMapUrls();

  return (
    <div className={styles.storeLocationContainer}>
      <div className={styles.locationHeader}>
        <h4>🏪 Ubicación de Nuestra Tienda</h4>
        <p>Yero Shop!</p>
        <p className={styles.address}>{STORE_COORDINATES.address}</p>
      </div>

      <div className={styles.mapContainer}>
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235.0!2d${STORE_COORDINATES.lng}!3d${STORE_COORDINATES.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDAyJzIyLjUiTiA3NcKwNTAnNTguOCJX!5e0!3m2!1ses!2scu!4v1640000000000!5m2!1ses!2scu`}
          width="100%"
          height="200"
          style={{ border: 0, borderRadius: 'var(--borderRadius)' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación de Yero Shop!"
        ></iframe>
      </div>

      <div className={styles.coordinatesInfo}>
        <p><strong>📍 Coordenadas:</strong> {STORE_COORDINATES.lat}, {STORE_COORDINATES.lng}</p>
      </div>

      <div className={styles.distanceSection}>
        <button 
          onClick={getUserLocation}
          disabled={isCalculating}
          className={`btn btn-primary ${styles.calculateBtn}`}
        >
          {isCalculating ? (
            <span className={styles.loading}>
              <span className="loader-2"></span>
              Calculando...
            </span>
          ) : (
            '📍 Calcular Distancia desde mi Ubicación'
          )}
        </button>

        {locationError && (
          <div className={styles.errorMessage}>
            <span>⚠️ {locationError}</span>
            <small>Puedes usar los enlaces de mapas para obtener direcciones</small>
          </div>
        )}

        {distanceData && (
          <div className={styles.distanceResults}>
            <h5>📏 Información de Distancia y Tiempo</h5>
            <div className={styles.distanceInfo}>
              <p><strong>📐 Distancia:</strong> {distanceData.distance.toFixed(2)} km</p>
            </div>
            
            <div className={styles.timeEstimates}>
              <h6>⏱️ Tiempos Estimados:</h6>
              <div className={styles.timeGrid}>
                <div className={styles.timeItem}>
                  <span className={styles.timeIcon}>🚗</span>
                  <span className={styles.timeLabel}>Automóvil</span>
                  <span className={styles.timeValue}>{formatTime(distanceData.carTime)}</span>
                </div>
                <div className={styles.timeItem}>
                  <span className={styles.timeIcon}>🚴‍♂️</span>
                  <span className={styles.timeLabel}>Bicicleta Eléctrica</span>
                  <span className={styles.timeValue}>{formatTime(distanceData.electricBicycleTime)}</span>
                </div>
                <div className={styles.timeItem}>
                  <span className={styles.timeIcon}>🚲</span>
                  <span className={styles.timeLabel}>Bicicleta</span>
                  <span className={styles.timeValue}>{formatTime(distanceData.bicycleTime)}</span>
                </div>
                <div className={styles.timeItem}>
                  <span className={styles.timeIcon}>🚶‍♂️</span>
                  <span className={styles.timeLabel}>Caminando</span>
                  <span className={styles.timeValue}>{formatTime(distanceData.walkingTime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.mapLinks}>
        <h5>🗺️ Abrir en Aplicaciones de Mapas</h5>
        <div className={styles.mapButtons}>
          <a 
            href={mapUrls.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-primary ${styles.mapBtn}`}
          >
            🗺️ Google Maps
          </a>
          <a 
            href={mapUrls.appleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-success ${styles.mapBtn}`}
          >
            🍎 Apple Maps
          </a>
          <a 
            href={mapUrls.waze}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-hipster ${styles.mapBtn}`}
          >
            🚗 Waze
          </a>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationMap;