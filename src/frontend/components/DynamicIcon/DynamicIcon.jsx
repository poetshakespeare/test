import React from 'react';
import { renderAiIcon } from '../../utils/iconUtils';

/**
 * Componente para renderizar iconos de react-icons/ai dinámicamente
 * @param {string} name - Nombre del icono (ej: 'AiFillHeart')
 * @param {number} size - Tamaño del icono
 * @param {string} color - Color del icono
 * @param {string} className - Clase CSS adicional
 * @param {object} style - Estilos inline
 * @param {function} onClick - Función de click
 * @param {object} ...props - Otras props del icono
 */
const DynamicIcon = ({ 
  name, 
  size = 24, 
  color, 
  className = '', 
  style = {}, 
  onClick,
  ...props 
}) => {
  const iconProps = {
    size,
    color,
    className,
    style,
    onClick,
    ...props
  };

  const icon = renderAiIcon(name, iconProps);
  
  if (!icon) {
    // Fallback si el icono no existe
    return (
      <span 
        className={`icon-fallback ${className}`}
        style={{ 
          display: 'inline-block', 
          width: size, 
          height: size, 
          backgroundColor: '#ccc',
          borderRadius: '2px',
          ...style 
        }}
        title={`Icono "${name}" no encontrado`}
      />
    );
  }

  return icon;
};

export default DynamicIcon;