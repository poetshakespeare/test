import { createContext, useContext, useEffect, useState } from 'react';
import { getFromLocalStorage, setIntoLocalStorage } from '../utils/utils';
import { LOCAL_STORAGE_KEYS, SUPER_ADMIN } from '../constants/constants';

const AuthContext = createContext(null);

export const useAuthContext = () => useContext(AuthContext);

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(
    getFromLocalStorage(LOCAL_STORAGE_KEYS.User)
  );
  const [token, setToken] = useState(
    getFromLocalStorage(LOCAL_STORAGE_KEYS.Token)
  );
  const [isAdmin, setIsAdmin] = useState(false);

  const updateUserAuth = ({ user, token }) => {
    setUser(user);
    setToken(token);
    
    // Verificar si es super administrador
    if (user && user.email === SUPER_ADMIN.email) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (user) {
      setUser((prev) => ({ ...prev, cart: [], wishlist: [] }));

      setIntoLocalStorage(LOCAL_STORAGE_KEYS.User, {
        ...user,
        cart: [],
        wishlist: [],
      });

      // Verificar si es admin al cargar
      if (user.email === SUPER_ADMIN.email) {
        setIsAdmin(true);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, updateUserAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;