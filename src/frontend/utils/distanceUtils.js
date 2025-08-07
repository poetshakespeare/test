/**
 * Utilidades para cálculo de distancias y tiempos de viaje
 */

import { STORE_LOCATION } from '../constants/constants';

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {object} coord1 - Coordenadas del primer punto {lat, lng}
 * @param {object} coord2 - Coordenadas del segundo punto {lat, lng}
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

/**
 * Calcula tiempos estimados de viaje para diferentes medios de transporte
 * @param {number} distance - Distancia en kilómetros
 * @returns {object} Tiempos estimados en minutos
 */
export const calculateTravelTimes = (distance) => {
  const speeds = {
    walking: 5, // km/h
    bicycle: 15, // km/h
    electricBicycle: 25, // km/h
    car: 30 // km/h en ciudad
  };

  return {
    walking: Math.round((distance / speeds.walking) * 60),
    bicycle: Math.round((distance / speeds.bicycle) * 60),
    electricBicycle: Math.round((distance / speeds.electricBicycle) * 60),
    car: Math.round((distance / speeds.car) * 60)
  };
};

/**
 * Formatea tiempo en minutos a formato legible
 * @param {number} minutes - Tiempo en minutos
 * @returns {string} Tiempo formateado
 */
export const formatTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Genera URLs para diferentes aplicaciones de mapas
 * @param {object} destination - Coordenadas de destino {lat, lng}
 * @param {object} origin - Coordenadas de origen {lat, lng} (opcional)
 * @returns {object} URLs para diferentes aplicaciones
 */
export const generateMapUrls = (destination, origin = null) => {
  const { lat, lng } = destination;
  
  const urls = {
    googleMaps: origin 
      ? `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${lat},${lng}`
      : `https://www.google.com/maps/place/${lat},${lng}`,
    appleMaps: origin
      ? `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${lat},${lng}&dirflg=d`
      : `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  };

  return urls;
};

/**
 * Obtiene la ubicación del usuario usando la API de geolocalización
 * @returns {Promise<object>} Promesa que resuelve con las coordenadas del usuario
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
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
            errorMessage = 'Error desconocido';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
};

/**
 * Calcula información completa de distancia y tiempo desde la ubicación del usuario a la tienda
 * @param {object} userCoords - Coordenadas del usuario {lat, lng}
 * @returns {object} Información completa de distancia y tiempos
 */
export const calculateStoreDistance = (userCoords) => {
  const distance = calculateDistance(userCoords, STORE_LOCATION.coordinates);
  const travelTimes = calculateTravelTimes(distance);
  const mapUrls = generateMapUrls(STORE_LOCATION.coordinates, userCoords);

  return {
    distance: distance,
    travelTimes: travelTimes,
    mapUrls: mapUrls,
    storeLocation: STORE_LOCATION,
    userLocation: userCoords
  };
};

/**
 * Genera mensaje de WhatsApp con información de distancia y ubicación
 * @param {object} distanceInfo - Información de distancia calculada
 * @returns {string} Mensaje formateado para WhatsApp
 */
export const generateDistanceMessage = (distanceInfo) => {
  if (!distanceInfo) return '';

  const { distance, travelTimes, storeLocation } = distanceInfo;

  let message = `\n--------------------------------\n`;
  message += `📍 *INFORMACIÓN DE UBICACIÓN Y DISTANCIA*\n`;
  message += `--------------------------------\n`;
  message += `🏪 *Tienda:* ${storeLocation.name}\n`;
  message += `📍 *Dirección:* ${storeLocation.address}\n`;
  message += `🗺️ *Coordenadas:* ${storeLocation.coordinates.lat}, ${storeLocation.coordinates.lng}\n`;
  message += `📏 *Distancia desde tu ubicación:* ${distance.toFixed(2)} km\n\n`;
  
  message += `⏱️ *TIEMPOS ESTIMADOS DE VIAJE:*\n`;
  message += `🚗 *En automóvil:* ${formatTime(travelTimes.car)}\n`;
  message += `🚴‍♂️ *En bicicleta eléctrica:* ${formatTime(travelTimes.electricBicycle)}\n`;
  message += `🚲 *En bicicleta:* ${formatTime(travelTimes.bicycle)}\n`;
  message += `🚶‍♂️ *Caminando:* ${formatTime(travelTimes.walking)}\n\n`;
  
  message += `🗺️ *ENLACES DE NAVEGACIÓN:*\n`;
  message += `• Google Maps: ${distanceInfo.mapUrls.googleMaps}\n`;
  message += `• Apple Maps: ${distanceInfo.mapUrls.appleMaps}\n`;
  message += `• Waze: ${distanceInfo.mapUrls.waze}\n`;

  return message;
};