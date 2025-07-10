import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar dispositivos móviles y sistemas operativos
 * @returns {object} Información detallada del dispositivo
 */
const useMobileDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isMacOS: false,
    isWindows: false,
    browser: '',
    screenSize: 'unknown'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const platform = navigator.platform || '';
      
      // Detectar sistemas operativos
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isWindows = /Windows/.test(userAgent);
      
      // Detectar tipo de dispositivo
      const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
      const isTablet = /iPad/.test(userAgent) || 
        (isAndroid && !/Mobile/.test(userAgent)) ||
        (window.innerWidth >= 768 && window.innerWidth <= 1024 && isMobile);
      const isDesktop = !isMobile && !isTablet;
      
      // Detectar navegador
      let browser = 'unknown';
      if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
        browser = 'chrome';
      } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
        browser = 'safari';
      } else if (/Firefox/.test(userAgent)) {
        browser = 'firefox';
      } else if (/Edge/.test(userAgent)) {
        browser = 'edge';
      }
      
      // Detectar tamaño de pantalla
      let screenSize = 'unknown';
      const width = window.innerWidth;
      if (width < 768) {
        screenSize = 'mobile';
      } else if (width < 1024) {
        screenSize = 'tablet';
      } else if (width < 1440) {
        screenSize = 'desktop';
      } else {
        screenSize = 'large';
      }
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isMacOS,
        isWindows,
        browser,
        screenSize,
        userAgent,
        platform,
        screenWidth: width,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    // Detectar al cargar
    detectDevice();
    
    // Detectar cambios de tamaño
    const handleResize = () => {
      detectDevice();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};

export default useMobileDetection;