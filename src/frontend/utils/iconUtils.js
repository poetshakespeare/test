/**
 * Utilidad para importar dinámicamente iconos de react-icons/ai
 * Permite usar cualquier icono de la librería AI sin importaciones explícitas
 */

import * as AiIcons from 'react-icons/ai';

/**
 * Obtiene un icono de react-icons/ai por su nombre
 * @param {string} iconName - Nombre del icono (ej: 'AiFillHeart', 'AiOutlineUser')
 * @param {object} props - Props a pasar al componente del icono
 * @returns {React.Component|null} - Componente del icono o null si no existe
 */
export const getAiIcon = (iconName, props = {}) => {
  const IconComponent = AiIcons[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono "${iconName}" no encontrado en react-icons/ai`);
    return null;
  }
  
  return IconComponent(props);
};

/**
 * Renderiza un icono de AI con props personalizadas
 * @param {string} iconName - Nombre del icono
 * @param {object} props - Props del icono (size, color, className, etc.)
 * @returns {React.Component|null} - Componente renderizado
 */
export const renderAiIcon = (iconName, props = {}) => {
  const IconComponent = AiIcons[iconName];
  
  if (!IconComponent) {
    console.warn(`Icono "${iconName}" no encontrado en react-icons/ai`);
    return null;
  }
  
  return <IconComponent {...props} />;
};

/**
 * Obtiene la lista de todos los iconos disponibles en react-icons/ai
 * @returns {string[]} - Array con los nombres de todos los iconos
 */
export const getAvailableAiIcons = () => {
  return Object.keys(AiIcons).filter(key => key.startsWith('Ai'));
};

/**
 * Busca iconos por término de búsqueda
 * @param {string} searchTerm - Término a buscar en los nombres de iconos
 * @returns {string[]} - Array con los nombres de iconos que coinciden
 */
export const searchAiIcons = (searchTerm) => {
  const allIcons = getAvailableAiIcons();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return allIcons.filter(iconName => 
    iconName.toLowerCase().includes(lowerSearchTerm)
  );
};

/**
 * Componente wrapper para usar iconos AI dinámicamente
 */
export const DynamicAiIcon = ({ name, ...props }) => {
  return renderAiIcon(name, props);
};

// Exportar todos los iconos para uso directo si es necesario
export { AiIcons };

// Ejemplos de uso:
/*
// Uso básico
const heartIcon = getAiIcon('AiFillHeart', { size: 24, color: 'red' });

// Con el componente wrapper
<DynamicAiIcon name="AiOutlineUser" size={20} className="user-icon" />

// Buscar iconos
const heartIcons = searchAiIcons('heart');
console.log(heartIcons); // ['AiFillHeart', 'AiOutlineHeart', ...]

// Obtener todos los iconos disponibles
const allIcons = getAvailableAiIcons();
console.log(allIcons.length); // Número total de iconos AI disponibles
*/