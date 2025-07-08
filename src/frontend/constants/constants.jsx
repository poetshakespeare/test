import { 
  AiFillGithub, 
  AiFillLinkedin, 
  AiOutlineTwitter,
  AiFillFacebook,
  AiOutlineApi
} from 'react-icons/ai';
import { FaNetworkWired } from 'react-icons/fa';
import { DiDatabase } from 'react-icons/di';
import { v4 as uuid } from 'uuid';

export const FOOTER_LINKS = [
  {
    id: 1,
    icon: <AiOutlineTwitter />,
    url: 'https://twitter.com/Swastik2001',
  },
  {
    id: 2,
    icon: <AiFillLinkedin />,
    url: 'https://www.linkedin.com/in/swastik-patro-2a54bb19b/',
  },
  {
    id: 3,
    icon: <AiFillGithub />,
    url: 'https://github.com/swastikpatro',
  },
  {
    id: 4,
    icon: <AiFillFacebook />,
    url: 'https://facebook.com/yeroshop',
  },
  {
    id: 5,
    icon: <FaNetworkWired />,
    url: 'https://yeroshop.vercel.app',
  },
];

// ICONOS DISPONIBLES PARA IMPORTACIÓN Y USO
export const AVAILABLE_ICONS = {
  // React Icons AI
  AiFillGithub,
  AiFillLinkedin,
  AiOutlineTwitter,
  AiFillFacebook,
  AiOutlineApi,
  // React Icons FA
  FaNetworkWired,
  // React Icons DI
  DiDatabase,
};

export const ToastType = {
  Warn: 'warn',
  Info: 'info',
  Success: 'success',
  Error: 'error',
};

export const SORT_TYPE = {
  PRICE_LOW_TO_HIGH: 'precio: menor a mayor',
  PRICE_HIGH_TO_LOW: 'precio: mayor a menor',
  NAME_A_TO_Z: 'nombre: a a z',
  NAME_Z_TO_A: 'nombre: z a a',
};

export const RATINGS = [4, 3, 2, 1];

export const TEST_USER = {
  email: 'yero.shop@gmail.com',
  password: 'yeroi1234',
};

export const SUPER_ADMIN = {
  email: 'admin@gadaelectronics.com',
  password: 'root',
};

export const GUEST_USER = {
  email: 'invitado@tienda.com',
  password: '123456',
};

export const LOCAL_STORAGE_KEYS = {
  User: 'user',
  Token: 'token',
  StoreConfig: 'storeConfig',
  Currency: 'selectedCurrency',
};

export const LOGIN_CLICK_TYPE = {
  GuestClick: 'guest',
  RegisterClick: 'register',
  AdminClick: 'admin',
  GoogleClick: 'google',
  FacebookClick: 'facebook',
  AppleClick: 'apple',
};

export const INCREMENT_DECRMENT_TYPE = {
  INCREMENT: 'increment',
  DECREMENT: 'decrement',
};

export const FILTER_INPUT_TYPE = {
  PRICE: 'price',
  COMPANY: 'company',
  SORT: 'sortByOption',
  RATING: 'rating',
  CATEGORY: 'category',
};

export const DELAY_TO_SHOW_LOADER = 500;
export const DELAY_DEBOUNCED_MS = 250;
export const TOTAL_SKELETONS_LENGTH = 10;
export const DELAY_BETWEEN_BLUR_AND_CLICK = 250;
export const CUSTOM_TOASTID = 1;
export const ITEMS_PER_PAGE = 9;

export const ALL_STATES = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla-La Mancha',
  'Castilla y León',
  'Cataluña',
  'Ceuta',
  'Comunidad de Madrid',
  'Comunidad Foral de Navarra',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Melilla',
  'País Vasco',
  'Región de Murcia',
];

export const SERVICE_TYPES = {
  HOME_DELIVERY: 'home_delivery',
  PICKUP: 'pickup'
};

// Zonas de Santiago de Cuba con costos de entrega - ACTUALIZADAS
export const SANTIAGO_ZONES = [
  {
    "id": "centro",
    "name": "Nuevo Vista Alegre",
    "cost": 100
  },
  {
    "id": "vista_alegre",
    "name": "Vista Alegre",
    "cost": 500
  },
  {
    "id": "sueno",
    "name": "Sueño",
    "cost": 300
  },
  {
    "id": "san_pedrito",
    "name": "San Pedrito",
    "cost": 250
  },
  {
    "id": "altamira",
    "name": "Altamira",
    "cost": 500
  },
  {
    "id": "micro_9",
    "name": "Micro 7, 8 , 9",
    "cost": 300
  },
  {
    "id": "alameda",
    "name": "Alameda",
    "cost": 250
  },
  {
    "id": "puerto",
    "name": "El Caney",
    "cost": 1000
  },
  {
    "id": "siboney",
    "name": "Quintero",
    "cost": 500
  },
  {
    "id": "ciudamar",
    "name": "Distrito José Martí",
    "cost": 200
  },
  {
    "id": "marimon",
    "name": "Marimon",
    "cost": 150
  },
  {
    "id": "los_cangrejitos",
    "name": "Los cangrejitos",
    "cost": 350
  },
  {
    "id": "trocha",
    "name": "Trocha",
    "cost": 350
  },
  {
    "id": "versalles",
    "name": "Versalles",
    "cost": 1000
  },
  {
    "id": "portuondo",
    "name": "Portuondo",
    "cost": 600
  },
  {
    "id": "30_de_noviembre",
    "name": "30 de Noviembre",
    "cost": 600
  },
  {
    "id": "rajayoga",
    "name": "Rajayoga",
    "cost": 800
  },
  {
    "id": "antonio_maceo",
    "name": "Antonio Maceo",
    "cost": 600
  },
  {
    "id": "los_pinos",
    "name": "Los Pinos",
    "cost": 300
  }
];

// Cupones de descuento - ACTUALIZADOS
export const COUPONS = [
  {
    "couponCode": "100% AHORRO",
    "text": "100% Descuento",
    "discountPercent": 55,
    "minCartPriceRequired": 300000,
    "id": "b6c7a585-79a2-4fde-93cd-80422ef3acfa"
  },
  {
    "couponCode": "20% REGALO",
    "text": "20% Descuento",
    "discountPercent": 20,
    "minCartPriceRequired": 200000,
    "id": "ecdff7ad-f653-467f-9257-7fcd0fdea3a8"
  },
  {
    "couponCode": "10% PROMO",
    "text": "10% Descuento",
    "discountPercent": 10,
    "minCartPriceRequired": 100000,
    "id": "4898bd1c-7227-47b0-b6fe-32159f71072b"
  },
  {
    "couponCode": "5% MENOS",
    "text": "5% Descuento",
    "discountPercent": 5,
    "minCartPriceRequired": 50000,
    "id": "12ee6cb8-1d2d-463d-b9f7-78bcd415c2e4"
  }
];

export const CHARGE_AND_DISCOUNT = {
  deliveryCharge: 0,
  discount: 0,
};

export const MIN_DISTANCE_BETWEEN_THUMBS = 1000;
export const MAX_RESPONSES_IN_CACHE_TO_STORE = 50;

// WhatsApp de la tienda - ACTUALIZADO
export const STORE_WHATSAPP = '+53 54690878';

// Configuración por defecto de la tienda - ACTUALIZADA
export const DEFAULT_STORE_CONFIG = {
  "storeName": "Yero Shop!",
  "whatsappNumber": "+53 54690878",
  "storeAddress": "Santiago de Cuba, Cuba",
  "lastModified": "2025-07-05T03:46:50.315Z",
  "version": "1.0.0"
};

// CÓDIGOS DE PAÍSES ACTUALIZADOS CON CUBA INCLUIDO
export const COUNTRY_CODES = [
  { code: '+53', country: 'Cuba', flag: '🇨🇺', minLength: 8, maxLength: 8 },
  { code: '+1', country: 'Estados Unidos/Canadá', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { code: '+52', country: 'México', flag: '🇲🇽', minLength: 10, maxLength: 10 },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', minLength: 10, maxLength: 11 },
  { code: '+55', country: 'Brasil', flag: '🇧🇷', minLength: 10, maxLength: 11 },
  { code: '+56', country: 'Chile', flag: '🇨🇱', minLength: 8, maxLength: 9 },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', minLength: 10, maxLength: 10 },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', minLength: 10, maxLength: 10 },
  { code: '+34', country: 'España', flag: '🇪🇸', minLength: 9, maxLength: 9 },
  { code: '+33', country: 'Francia', flag: '🇫🇷', minLength: 10, maxLength: 10 },
  { code: '+39', country: 'Italia', flag: '🇮🇹', minLength: 10, maxLength: 10 },
  { code: '+49', country: 'Alemania', flag: '🇩🇪', minLength: 10, maxLength: 12 },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { code: '+7', country: 'Rusia', flag: '🇷🇺', minLength: 10, maxLength: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', minLength: 11, maxLength: 11 },
  { code: '+81', country: 'Japón', flag: '🇯🇵', minLength: 10, maxLength: 11 },
  { code: '+82', country: 'Corea del Sur', flag: '🇰🇷', minLength: 10, maxLength: 11 },
  { code: '+91', country: 'India', flag: '🇮🇳', minLength: 10, maxLength: 10 },
];

// ICONOS PARA PRODUCTOS POR CATEGORÍA
export const PRODUCT_CATEGORY_ICONS = {
  'laptop': '💻',
  'tv': '📺',
  'smartwatch': '⌚',
  'earphone': '🎧',
  'mobile': '📱',
  'smartphone': '📱',
  'tablet': '📱',
  'computer': '💻',
  'monitor': '🖥️',
  'keyboard': '⌨️',
  'mouse': '🖱️',
  'speaker': '🔊',
  'camera': '📷',
  'gaming': '🎮',
  'accessories': '🔌',
  'default': '📦'
};

// CONSTANTES DE MONEDA
export const CURRENCIES = {
  CUP: {
    code: 'CUP',
    name: 'Peso Cubano',
    symbol: '$',
    flag: '🇨🇺',
    rate: 1,
  },
  USD: {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    flag: '🇺🇸',
    rate: 384,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rate: 425,
  },
  MLC: {
    code: 'MLC',
    name: 'Moneda Libremente Convertible',
    symbol: 'MLC',
    flag: '🏦',
    rate: 250,
  },
};

export const DEFAULT_CURRENCY = 'CUP';

// PROVEEDORES DE EMAIL SOPORTADOS PARA REGISTRO
export const EMAIL_PROVIDERS = {
  GMAIL: {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    icon: '📧',
    color: '#ea4335',
    authUrl: 'https://accounts.google.com/oauth/authorize',
  },
  OUTLOOK: {
    name: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    icon: '📨',
    color: '#0078d4',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  YAHOO: {
    name: 'Yahoo! Mail',
    domains: ['yahoo.com', 'yahoo.es', 'ymail.com', 'rocketmail.com'],
    icon: '📮',
    color: '#6001d2',
    authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
  },
  APPLE: {
    name: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    icon: '📧',
    color: '#000000',
    authUrl: 'https://appleid.apple.com/auth/authorize',
  },
  PROTONMAIL: {
    name: 'ProtonMail',
    domains: ['protonmail.com', 'proton.me', 'pm.me'],
    icon: '🔒',
    color: '#6d4aff',
    authUrl: null, // ProtonMail no tiene OAuth público
  },
  AOL: {
    name: 'AOL Mail',
    domains: ['aol.com', 'aim.com'],
    icon: '📬',
    color: '#ff0b00',
    authUrl: 'https://api.login.aol.com/oauth2/request_auth',
  },
  FASTMAIL: {
    name: 'Fastmail',
    domains: ['fastmail.com', 'fastmail.fm'],
    icon: '⚡',
    color: '#2e5c8a',
    authUrl: null, // Fastmail no tiene OAuth público estándar
  },
  ZOHO: {
    name: 'Zoho Mail',
    domains: ['zoho.com', 'zohomail.com'],
    icon: '📧',
    color: '#e42527',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  },
};

// VALIDACIÓN DE DOMINIOS DE EMAIL
export const validateEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  for (const [providerKey, provider] of Object.entries(EMAIL_PROVIDERS)) {
    if (provider.domains.includes(domain)) {
      return {
        provider: providerKey,
        ...provider,
      };
    }
  }

  return {
    provider: 'OTHER',
    name: 'Otro proveedor',
    icon: '📧',
    color: '#666666',
    authUrl: null,
  };
};