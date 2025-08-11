import React, { useState, useEffect } from 'react';
import styles from './StoreLocationMap.module.css';

const StoreLocationMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Coordenadas de la tienda Yero Shop!
  const STORE_LOCATION = {
    lat: 20.039585,
    lng: -75.849663,
    address: 'Santiago de Cuba, Cuba'
  };

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        
        // Calcular distancia
        const dist = calculateDistance(
          userLat, 
          userLng, 
          STORE_LOCATION.lat, 
          STORE_LOCATION.lng
        );
        
        setDistance(dist);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // URLs para diferentes aplicaciones de mapas
  const getMapUrls = () => {
    const storeCoords = `${STORE_LOCATION.lat},${STORE_LOCATION.lng}`;
    const storeAddress = encodeURIComponent(STORE_LOCATION.address);
    
    return {
      googleMaps: `https://www.google.com/maps/place/${storeCoords}/@${storeCoords},180m/data=!3m1!1e3!4m4!3m3!8m2!3d${STORE_LOCATION.lat}!4d${STORE_LOCATION.lng}`,
      googleMapsApp: `https://maps.google.com/?q=${storeCoords}`,
      appleMaps: `https://maps.apple.com/?q=${storeAddress}&ll=${storeCoords}`,
      wazeApp: `https://waze.com/ul?q=${storeAddress}&ll=${storeCoords}`,
      directions: userLocation 
        ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${storeCoords}`
        : `https://www.google.com/maps/dir//${storeCoords}`
    };
  };

  const mapUrls = getMapUrls();

  return (
    <div className={styles.storeLocationContainer}>
      <div className={styles.locationHeader}>
        <h4>📍 Ubicación de Yero Shop!</h4>
        <p>Ven a recoger tu pedido en nuestra tienda</p>
      </div>

      {/* Mapa embebido de Google Maps */}
      <div className={styles.mapContainer}>
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235.0!2d${STORE_LOCATION.lng}!3d${STORE_LOCATION.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDAyJzIyLjUiTiA3NcKwNTAnNTguOCJX!5e0!3m2!1ses!2scu!4v1640000000000!5m2!1ses!2scu&zoom=18`}
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación de Yero Shop!"
        ></iframe>
      </div>

      {/* Información de la tienda */}
      <div className={styles.storeInfo}>
        <div className={styles.storeDetails}>
          <h5>🏪 <span className="yero-shop-text-small">Yero Shop!</span></h5>
          <p>📍 Santiago de Cuba, Cuba</p>
          <p>📞 WhatsApp: +53 54690878</p>
          <p>🕒 Horarios: Lunes a Domingo</p>
        </div>

        <div className={styles.coordinates}>
          <h6>📐 Coordenadas GPS:</h6>
          <p>Latitud: {STORE_LOCATION.lat}</p>
          <p>Longitud: {STORE_LOCATION.lng}</p>
        </div>
      </div>

      {/* Sección de ubicación del usuario */}
      <div className={styles.userLocationSection}>
        <div className={styles.locationActions}>
          <button
            type="button"
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className={`btn btn-primary ${styles.locationBtn}`}
          >
            {isLoadingLocation ? (
              <span className={styles.loading}>
                <span className="loader-2"></span>
                Obteniendo ubicación...
              </span>
            ) : (
              '📍 Calcular Distancia desde mi Ubicación'
            )}
          </button>
        </div>

        {distance && (
          <div className={styles.distanceInfo}>
            <h6>📏 Distancia Calculada:</h6>
            <div className={styles.distanceDisplay}>
              <span className={styles.distanceNumber}>
                {distance.toFixed(2)} km
              </span>
              <span className={styles.distanceText}>
                desde tu ubicación actual
              </span>
            </div>
            {distance > 10 && (
              <div className={styles.distanceWarning}>
                ⚠️ La distancia es considerable. Te recomendamos verificar la ruta antes de venir.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enlaces para abrir en diferentes aplicaciones */}
      <div className={styles.mapLinks}>
        <h6>🗺️ Abrir en tu aplicación favorita:</h6>
        <div className={styles.linkButtons}>
          <a
            href={mapUrls.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-success ${styles.mapLink}`}
          >
            🌐 Google Maps
          </a>
          <a
            href={mapUrls.googleMapsApp}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-primary ${styles.mapLink}`}
          >
            📱 App Google Maps
          </a>
          <a
            href={mapUrls.appleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-hipster ${styles.mapLink}`}
          >
            🍎 Apple Maps
          </a>
          <a
            href={mapUrls.wazeApp}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-activated ${styles.mapLink}`}
          >
            🚗 Waze
          </a>
          {userLocation && (
            <a
              href={mapUrls.directions}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-danger ${styles.mapLink}`}
            >
              🧭 Cómo Llegar
            </a>
          )}
        </div>
      </div>

      {/* Instrucciones adicionales */}
      <div className={styles.instructions}>
        <h6>ℹ️ Instrucciones para llegar:</h6>
        <ul>
          <li>🚗 Si vienes en auto, hay estacionamiento disponible</li>
          <li>🚌 Accesible por transporte público</li>
          <li>📱 Llama al +53 54690878 si necesitas ayuda para ubicarnos</li>
          <li>🕒 Coordina tu horario de recogida por WhatsApp</li>
        </ul>
      </div>
    </div>
  );
};

export default StoreLocationMap;