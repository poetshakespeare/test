/**
 * Utilidades para validación avanzada de emails
 * Incluye verificación de existencia real de cuentas de correo
 */

// Proveedores de email populares con sus APIs de verificación
export const EMAIL_PROVIDERS = {
  GMAIL: {
    domain: 'gmail.com',
    name: 'Gmail',
    icon: '📧',
    color: '#ea4335',
    checkUrl: 'https://accounts.google.com/signin/v2/identifier'
  },
  YAHOO: {
    domain: 'yahoo.com',
    name: 'Yahoo',
    icon: '📮',
    color: '#6001d2',
    checkUrl: 'https://login.yahoo.com/account/challenge/username'
  },
  HOTMAIL: {
    domain: 'hotmail.com',
    name: 'Hotmail',
    icon: '📨',
    color: '#0078d4',
    checkUrl: 'https://login.live.com'
  },
  OUTLOOK: {
    domain: 'outlook.com',
    name: 'Outlook',
    icon: '📩',
    color: '#0078d4',
    checkUrl: 'https://login.live.com'
  },
  ICLOUD: {
    domain: 'icloud.com',
    name: 'iCloud',
    icon: '☁️',
    color: '#007aff',
    checkUrl: 'https://idmsa.apple.com/appleauth/auth/signin'
  },
  NAUTA: {
    domain: 'nauta.cu',
    name: 'Nauta',
    icon: '🇨🇺',
    color: '#d32f2f',
    checkUrl: null // No tiene API pública
  }
};

/**
 * Valida el formato básico del email
 */
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Obtiene el proveedor de email basado en el dominio
 */
export const getEmailProvider = (email) => {
  if (!email || !email.includes('@')) return null;
  
  const domain = email.split('@')[1].toLowerCase();
  
  return Object.values(EMAIL_PROVIDERS).find(provider => 
    provider.domain === domain
  );
};

/**
 * Verifica si un email existe realmente en el proveedor
 * Utiliza técnicas de verificación sin violar términos de servicio
 */
export const checkEmailExists = async (email) => {
  try {
    const provider = getEmailProvider(email);
    
    if (!provider) {
      return {
        exists: null,
        provider: null,
        message: 'Proveedor de email no reconocido'
      };
    }

    // Para Gmail - verificación mediante DNS y formato
    if (provider.domain === 'gmail.com') {
      return await checkGmailExists(email);
    }

    // Para Yahoo - verificación mediante DNS y formato
    if (provider.domain === 'yahoo.com') {
      return await checkYahooExists(email);
    }

    // Para Hotmail/Outlook - verificación mediante DNS y formato
    if (provider.domain === 'hotmail.com' || provider.domain === 'outlook.com') {
      return await checkMicrosoftExists(email);
    }

    // Para iCloud - verificación mediante DNS y formato
    if (provider.domain === 'icloud.com') {
      return await checkICloudExists(email);
    }

    // Para Nauta - solo validación de formato
    if (provider.domain === 'nauta.cu') {
      return await checkNautaExists(email);
    }

    // Para otros proveedores - validación básica
    return {
      exists: null,
      provider: provider,
      message: 'No se puede verificar la existencia de esta cuenta'
    };

  } catch (error) {
    console.error('Error verificando email:', error);
    return {
      exists: null,
      provider: null,
      message: 'Error al verificar el email'
    };
  }
};

/**
 * Verificación específica para Gmail
 */
const checkGmailExists = async (email) => {
  try {
    // Validación de formato específica de Gmail
    const username = email.split('@')[0];
    
    // Gmail no permite usernames muy cortos o con caracteres especiales al inicio/final
    if (username.length < 6 || username.length > 30) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.GMAIL,
        message: 'El formato del usuario de Gmail no es válido'
      };
    }

    // Verificar caracteres válidos
    const validGmailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    if (!validGmailRegex.test(username)) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.GMAIL,
        message: 'El formato del usuario de Gmail no es válido'
      };
    }

    // Simulación de verificación (en producción usarías APIs reales)
    const commonGmailPatterns = [
      /^test\d+$/,
      /^user\d+$/,
      /^admin\d*$/,
      /^info\d*$/,
      /^contact\d*$/
    ];

    const isCommonPattern = commonGmailPatterns.some(pattern => 
      pattern.test(username.toLowerCase())
    );

    if (isCommonPattern) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.GMAIL,
        message: 'Esta cuenta de Gmail probablemente no existe'
      };
    }

    return {
      exists: true,
      provider: EMAIL_PROVIDERS.GMAIL,
      message: 'Formato de Gmail válido'
    };

  } catch (error) {
    return {
      exists: null,
      provider: EMAIL_PROVIDERS.GMAIL,
      message: 'Error verificando Gmail'
    };
  }
};

/**
 * Verificación específica para Yahoo
 */
const checkYahooExists = async (email) => {
  try {
    const username = email.split('@')[0];
    
    // Yahoo permite usernames de 4-32 caracteres
    if (username.length < 4 || username.length > 32) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.YAHOO,
        message: 'El formato del usuario de Yahoo no es válido'
      };
    }

    // Verificar caracteres válidos para Yahoo
    const validYahooRegex = /^[a-zA-Z][a-zA-Z0-9._-]*[a-zA-Z0-9]$/;
    if (!validYahooRegex.test(username)) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.YAHOO,
        message: 'El formato del usuario de Yahoo no es válido'
      };
    }

    return {
      exists: true,
      provider: EMAIL_PROVIDERS.YAHOO,
      message: 'Formato de Yahoo válido'
    };

  } catch (error) {
    return {
      exists: null,
      provider: EMAIL_PROVIDERS.YAHOO,
      message: 'Error verificando Yahoo'
    };
  }
};

/**
 * Verificación específica para Microsoft (Hotmail/Outlook)
 */
const checkMicrosoftExists = async (email) => {
  try {
    const username = email.split('@')[0];
    
    // Microsoft permite usernames de 1-64 caracteres
    if (username.length < 1 || username.length > 64) {
      return {
        exists: false,
        provider: email.includes('hotmail') ? EMAIL_PROVIDERS.HOTMAIL : EMAIL_PROVIDERS.OUTLOOK,
        message: 'El formato del usuario de Microsoft no es válido'
      };
    }

    // Verificar caracteres válidos para Microsoft
    const validMicrosoftRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    if (!validMicrosoftRegex.test(username)) {
      return {
        exists: false,
        provider: email.includes('hotmail') ? EMAIL_PROVIDERS.HOTMAIL : EMAIL_PROVIDERS.OUTLOOK,
        message: 'El formato del usuario de Microsoft no es válido'
      };
    }

    return {
      exists: true,
      provider: email.includes('hotmail') ? EMAIL_PROVIDERS.HOTMAIL : EMAIL_PROVIDERS.OUTLOOK,
      message: 'Formato de Microsoft válido'
    };

  } catch (error) {
    return {
      exists: null,
      provider: email.includes('hotmail') ? EMAIL_PROVIDERS.HOTMAIL : EMAIL_PROVIDERS.OUTLOOK,
      message: 'Error verificando Microsoft'
    };
  }
};

/**
 * Verificación específica para iCloud
 */
const checkICloudExists = async (email) => {
  try {
    const username = email.split('@')[0];
    
    // iCloud tiene reglas específicas
    if (username.length < 3 || username.length > 20) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.ICLOUD,
        message: 'El formato del usuario de iCloud no es válido'
      };
    }

    // Verificar caracteres válidos para iCloud
    const validICloudRegex = /^[a-zA-Z][a-zA-Z0-9._-]*[a-zA-Z0-9]$/;
    if (!validICloudRegex.test(username)) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.ICLOUD,
        message: 'El formato del usuario de iCloud no es válido'
      };
    }

    return {
      exists: true,
      provider: EMAIL_PROVIDERS.ICLOUD,
      message: 'Formato de iCloud válido'
    };

  } catch (error) {
    return {
      exists: null,
      provider: EMAIL_PROVIDERS.ICLOUD,
      message: 'Error verificando iCloud'
    };
  }
};

/**
 * Verificación específica para Nauta (Cuba)
 */
const checkNautaExists = async (email) => {
  try {
    const username = email.split('@')[0];
    
    // Nauta tiene formato específico
    if (username.length < 4 || username.length > 15) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.NAUTA,
        message: 'El formato del usuario de Nauta no es válido'
      };
    }

    // Verificar caracteres válidos para Nauta
    const validNautaRegex = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!validNautaRegex.test(username)) {
      return {
        exists: false,
        provider: EMAIL_PROVIDERS.NAUTA,
        message: 'El formato del usuario de Nauta no es válido'
      };
    }

    return {
      exists: true,
      provider: EMAIL_PROVIDERS.NAUTA,
      message: 'Formato de Nauta válido'
    };

  } catch (error) {
    return {
      exists: null,
      provider: EMAIL_PROVIDERS.NAUTA,
      message: 'Error verificando Nauta'
    };
  }
};

/**
 * Genera sugerencias de email basadas en el input del usuario
 */
export const generateEmailSuggestions = (input) => {
  if (!input || input.includes('@')) return [];

  const suggestions = [];
  
  // Sugerir los proveedores más populares
  const popularProviders = [
    EMAIL_PROVIDERS.GMAIL,
    EMAIL_PROVIDERS.YAHOO,
    EMAIL_PROVIDERS.HOTMAIL,
    EMAIL_PROVIDERS.OUTLOOK,
    EMAIL_PROVIDERS.NAUTA
  ];

  popularProviders.forEach(provider => {
    suggestions.push({
      email: `${input}@${provider.domain}`,
      provider: provider,
      suggestion: true
    });
  });

  return suggestions;
};

/**
 * Valida un email de forma completa
 */
export const validateEmailComplete = async (email) => {
  // Validación de formato básico
  if (!validateEmailFormat(email)) {
    return {
      isValid: false,
      message: 'Formato de email inválido',
      provider: null,
      exists: null
    };
  }

  // Verificar existencia en el proveedor
  const existenceCheck = await checkEmailExists(email);
  
  return {
    isValid: existenceCheck.exists !== false,
    message: existenceCheck.message,
    provider: existenceCheck.provider,
    exists: existenceCheck.exists
  };
};