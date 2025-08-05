/**
 * Utilidades para calcular distancia, tiempo y rutas desde la ubicación del cliente
 * hasta la tienda Yero Shop! en Santiago de Cuba
 */

// Coordenadas de la tienda Yero Shop!
export const STORE_COORDINATES = {
  lat: 20.039585,
  lng: -75.849663,
  address: 'Reparto Nuevo Vista Alegre, Santiago de Cuba'
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
};

/**
 * Convierte grados a radianes
 * @param {number} degrees - Grados
 * @returns {number} Radianes
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calcula tiempo estimado y información de viaje según el medio de transporte
 * @param {number} distanceKm - Distancia en kilómetros
 * @returns {object} Información de viaje para diferentes medios de transporte
 */
export const calculateTravelInfo = (distanceKm) => {
  // Velocidades promedio en km/h para Santiago de Cuba
  const speeds = {
    walking: 4,           // Caminando
    bicycle: 15,          // Bicicleta de pedales
    electricBike: 25,     // Bicicleta eléctrica
    motorcycle: 35,       // Moto eléctrica (velocidad urbana)
    car: 40               // Automóvil (velocidad urbana)
  };

  const calculateTime = (speed) => {
    const timeHours = distanceKm / speed;
    const minutes = Math.round(timeHours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  };

  return {
    distance: `${distanceKm} km`,
    walking: {
      time: calculateTime(speeds.walking),
      icon: '🚶‍♂️',
      description: 'Caminando'
    },
    bicycle: {
      time: calculateTime(speeds.bicycle),
      icon: '🚴‍♂️',
      description: 'Bicicleta de pedales'
    },
    electricBike: {
      time: calculateTime(speeds.electricBike),
      icon: '🚴‍♂️⚡',
      description: 'Bicicleta eléctrica'
    },
    motorcycle: {
      time: calculateTime(speeds.motorcycle),
      icon: '🏍️',
      description: 'Moto eléctrica'
    },
    car: {
      time: calculateTime(speeds.car),
      icon: '🚗',
      description: 'Automóvil'
    }
  };
};

/**
 * Obtiene la ubicación del usuario usando la API de geolocalización
 * @returns {Promise<object>} Coordenadas del usuario
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por este navegador'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutos
    };

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
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Calcula información completa de viaje desde la ubicación del usuario hasta la tienda
 * @param {object} userLocation - Coordenadas del usuario {lat, lng}
 * @returns {object} Información completa de viaje
 */
export const calculateTripToStore = (userLocation) => {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    STORE_COORDINATES.lat,
    STORE_COORDINATES.lng
  );

  const travelInfo = calculateTravelInfo(distance);

  return {
    ...travelInfo,
    storeLocation: STORE_COORDINATES,
    userLocation,
    mapLinks: {
      googleMaps: `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`,
      appleMaps: `https://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`,
      waze: `https://waze.com/ul?ll=${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}&navigate=yes`
    }
  };
};

/**
 * Genera mensaje de WhatsApp con información de distancia y tiempo
 * @param {object} tripInfo - Información del viaje
 * @returns {string} Mensaje formateado para WhatsApp
 */
export const generateDistanceMessage = (tripInfo) => {
  let message = `📍 *INFORMACIÓN DE DISTANCIA Y TIEMPO*\n`;
  message += `--------------------------------------------\n`;
  message += `📏 Distancia: ${tripInfo.distance}\n\n`;
  
  message += `⏱️ *Tiempo estimado de viaje:*\n`;
  message += `${tripInfo.walking.icon} ${tripInfo.walking.description}: ${tripInfo.walking.time}\n`;
  message += `${tripInfo.bicycle.icon} ${tripInfo.bicycle.description}: ${tripInfo.bicycle.time}\n`;
  message += `${tripInfo.electricBike.icon} ${tripInfo.electricBike.description}: ${tripInfo.electricBike.time}\n`;
  message += `${tripInfo.motorcycle.icon} ${tripInfo.motorcycle.description}: ${tripInfo.motorcycle.time}\n`;
  message += `${tripInfo.car.icon} ${tripInfo.car.description}: ${tripInfo.car.time}\n\n`;
  
  message += `🗺️ *Enlaces de navegación:*\n`;
  message += `🗺️ Google Maps: ${tripInfo.mapLinks.googleMaps}\n`;
  message += `🍎 Apple Maps: ${tripInfo.mapLinks.appleMaps}\n`;
  message += `🚗 Waze: ${tripInfo.mapLinks.waze}\n\n`;
  
  return message;
};