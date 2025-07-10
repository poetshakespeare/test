import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FormRow,
  LoginAndSignupLayout,
  PasswordRow,
  Title,
} from '../components';
import { useFormInput, useNavigateIfRegistered } from '../hooks';
import { setIntoLocalStorage, toastHandler } from '../utils/utils';
import { ToastType, LOCAL_STORAGE_KEYS } from '../constants/constants';
import { useState, useEffect } from 'react';
import { signupService } from '../Services/services';
import { useAuthContext } from '../contexts/AuthContextProvider';
import styles from './SignupPage.module.css';

// Proveedores de email soportados
const EMAIL_PROVIDERS = {
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
    authUrl: null,
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
    authUrl: null,
  },
  ZOHO: {
    name: 'Zoho Mail',
    domains: ['zoho.com', 'zohomail.com'],
    icon: '📧',
    color: '#e42527',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  },
};

// Función para validar dominio de email
const validateEmailDomain = (email) => {
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

const SignupPage = () => {
  const signupPageLocation = useLocation();
  const { updateUserAuth, user } = useAuthContext();

  const navigate = useNavigate();
  useNavigateIfRegistered(user);

  const { userInputs, handleInputChange } = useFormInput({
    firstName: '',
    lastName: '',
    email: '',
    passwordMain: '',
    passwordConfirm: '',
  });

  const [isSignupFormLoading, setIsSignupFormLoading] = useState(false);
  const [emailProvider, setEmailProvider] = useState(null);
  const [showProviderOptions, setShowProviderOptions] = useState(false);

  // Detectar proveedor de email cuando el usuario escribe
  useEffect(() => {
    if (userInputs.email.includes('@')) {
      const provider = validateEmailDomain(userInputs.email);
      setEmailProvider(provider);
      setShowProviderOptions(true);
    } else {
      setEmailProvider(null);
      setShowProviderOptions(false);
    }
  }, [userInputs.email]);

  // Función para detectar el dispositivo y sistema operativo
  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isWindows = /Windows/.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
    
    return {
      isIOS,
      isMacOS,
      isAndroid,
      isWindows,
      isMobile,
      isAppleDevice: isIOS || isMacOS
    };
  };

  // Función para abrir el proveedor de email nativo
  const openEmailProvider = (provider) => {
    const device = detectDevice();
    let emailUrl = '';

    switch (provider.provider) {
      case 'GMAIL':
        if (device.isAndroid) {
          emailUrl = 'intent://compose#Intent;scheme=mailto;package=com.google.android.gm;end';
        } else if (device.isIOS) {
          emailUrl = 'googlegmail://';
        } else {
          emailUrl = 'https://mail.google.com/mail/u/0/#inbox?compose=new';
        }
        break;

      case 'OUTLOOK':
        if (device.isAndroid) {
          emailUrl = 'intent://compose#Intent;scheme=mailto;package=com.microsoft.office.outlook;end';
        } else if (device.isIOS) {
          emailUrl = 'ms-outlook://';
        } else {
          emailUrl = 'https://outlook.live.com/mail/0/inbox';
        }
        break;

      case 'YAHOO':
        if (device.isAndroid) {
          emailUrl = 'intent://compose#Intent;scheme=mailto;package=com.yahoo.mobile.client.android.mail;end';
        } else if (device.isIOS) {
          emailUrl = 'ymail://';
        } else {
          emailUrl = 'https://mail.yahoo.com/';
        }
        break;

      case 'APPLE':
        if (device.isAppleDevice) {
          emailUrl = 'mailto:';
        } else {
          emailUrl = 'https://www.icloud.com/mail/';
        }
        break;

      default:
        // Para otros proveedores, intentar abrir la aplicación de email por defecto
        if (device.isMobile) {
          emailUrl = 'mailto:';
        } else {
          toastHandler(ToastType.Info, `Abre tu aplicación de ${provider.name} para verificar tu cuenta`);
          return;
        }
    }

    try {
      if (emailUrl) {
        window.open(emailUrl, '_blank');
        toastHandler(ToastType.Success, `Abriendo ${provider.name}...`);
      }
    } catch (error) {
      toastHandler(ToastType.Info, `Por favor abre manualmente tu aplicación de ${provider.name}`);
    }
  };

  // Función para registro rápido con OAuth (simulado)
  const handleQuickSignup = async (provider) => {
    if (!provider.authUrl) {
      toastHandler(ToastType.Info, `${provider.name} no soporta registro automático. Completa el formulario manualmente.`);
      return;
    }

    setIsSignupFormLoading(true);
    
    try {
      // Simular proceso OAuth
      toastHandler(ToastType.Info, `Conectando con ${provider.name}...`);
      
      // En una implementación real, aquí se abriría una ventana OAuth
      // Por ahora, simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular datos del usuario desde OAuth
      const mockUserData = {
        firstName: 'Usuario',
        lastName: provider.name,
        email: userInputs.email || `usuario@${provider.domains[0]}`,
        password: 'oauth_generated_password_' + Date.now(),
      };

      const { user, token } = await signupService(mockUserData);

      updateUserAuth({ user, token });
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.User, user);
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.Token, token);

      toastHandler(ToastType.Success, `¡Registro exitoso con ${provider.name}! Bienvenido ${mockUserData.firstName} 🎉`);
      navigate(signupPageLocation?.state?.from ?? '/');

    } catch (error) {
      console.error('Error en registro OAuth:', error);
      toastHandler(ToastType.Error, `Error al registrarse con ${provider.name}. Intenta el registro manual.`);
    } finally {
      setIsSignupFormLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    // Validaciones del formulario
    if (!userInputs.firstName.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu nombre');
      return;
    }

    if (!userInputs.lastName.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu apellido');
      return;
    }

    if (!userInputs.email.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu email');
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInputs.email.trim())) {
      toastHandler(ToastType.Error, 'Por favor ingresa un email válido');
      return;
    }

    if (!userInputs.passwordMain.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa una contraseña');
      return;
    }

    if (userInputs.passwordMain.length < 6) {
      toastHandler(ToastType.Error, 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (userInputs.passwordMain !== userInputs.passwordConfirm) {
      toastHandler(
        ToastType.Error,
        '¡Las contraseñas no coinciden!'
      );
      return;
    }

    const { email, firstName, lastName, passwordMain: password } = userInputs;

    setIsSignupFormLoading(true);

    try {
      const { user, token } = await signupService({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      updateUserAuth({ user, token });
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.User, user);
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.Token, token);

      toastHandler(ToastType.Success, `¡Registro exitoso! Bienvenido ${firstName} 🎉`);
      
      // Sugerir verificar email si se detectó un proveedor
      if (emailProvider && emailProvider.provider !== 'OTHER') {
        setTimeout(() => {
          toastHandler(ToastType.Info, `💡 Verifica tu email en ${emailProvider.name}`);
        }, 2000);
      }

      navigate(signupPageLocation?.state?.from ?? '/');
    } catch (error) {
      console.error('Error de registro:', error);
      let errorText = 'Error al crear la cuenta. Intenta nuevamente.';
      
      if (error?.response?.data?.errors && error.response.data.errors.length > 0) {
        errorText = error.response.data.errors[0];
      } else if (error?.message) {
        errorText = error.message;
      }
      
      toastHandler(ToastType.Error, errorText);
    }

    setIsSignupFormLoading(false);
  };

  if (!!user) {
    return <main className='full-page'></main>;
  }

  return (
    <LoginAndSignupLayout>
      <Title>Registrarse</Title>

      {/* Opciones de registro rápido */}
      {showProviderOptions && emailProvider && emailProvider.provider !== 'OTHER' && (
        <div className={styles.providerOptions}>
          <div className={styles.providerCard} style={{ borderColor: emailProvider.color }}>
            <div className={styles.providerInfo}>
              <span className={styles.providerIcon}>{emailProvider.icon}</span>
              <div>
                <h4>{emailProvider.name}</h4>
                <p>Detectado automáticamente</p>
              </div>
            </div>
            <div className={styles.providerActions}>
              {emailProvider.authUrl && (
                <button
                  type="button"
                  onClick={() => handleQuickSignup(emailProvider)}
                  disabled={isSignupFormLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: emailProvider.color }}
                >
                  {isSignupFormLoading ? (
                    <span className='loader-2'></span>
                  ) : (
                    `Registro rápido con ${emailProvider.name}`
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => openEmailProvider(emailProvider)}
                className="btn btn-hipster"
              >
                Abrir {emailProvider.name}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateAccount}>
        <FormRow
          text='Nombre'
          type='text'
          name='firstName'
          id='firstName'
          placeholder='Tu nombre'
          value={userInputs.firstName}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />
        <FormRow
          text='Apellido'
          type='text'
          name='lastName'
          id='lastName'
          placeholder='Tu apellido'
          value={userInputs.lastName}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />

        <div className={styles.emailField}>
          <FormRow
            text='Correo Electrónico'
            type='email'
            name='email'
            id='email'
            placeholder='tu-email@ejemplo.com'
            value={userInputs.email}
            handleChange={handleInputChange}
            disabled={isSignupFormLoading}
          />
          {emailProvider && (
            <div className={styles.emailProvider}>
              <span className={styles.providerIcon}>{emailProvider.icon}</span>
              <span>{emailProvider.name}</span>
            </div>
          )}
        </div>

        <PasswordRow
          text='Contraseña (mínimo 6 caracteres)'
          name='passwordMain'
          id='passwordMain'
          placeholder='Tu contraseña'
          value={userInputs.passwordMain}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />
        <PasswordRow
          text='Confirmar Contraseña'
          name='passwordConfirm'
          id='passwordConfirm'
          placeholder='Confirma tu contraseña'
          value={userInputs.passwordConfirm}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />

        <button 
          className='btn btn-block' 
          type='submit'
          disabled={isSignupFormLoading}
        >
          {isSignupFormLoading ? (
            <span className='loader-2'></span>
          ) : (
            'Crear Nueva Cuenta'
          )}
        </button>
      </form>

      {/* Proveedores de email populares */}
      <div className={styles.popularProviders}>
        <h4>Proveedores de email soportados:</h4>
        <div className={styles.providersList}>
          {Object.values(EMAIL_PROVIDERS).map((provider) => (
            <div key={provider.name} className={styles.providerChip}>
              <span>{provider.icon}</span>
              <span>{provider.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span>
          ¿Ya estás registrado?{' '}
          <Link
            to='/login'
            state={{ from: signupPageLocation?.state?.from ?? '/' }}
          >
            iniciar sesión
          </Link>
        </span>
      </div>
    </LoginAndSignupLayout>
  );
};

export default SignupPage;