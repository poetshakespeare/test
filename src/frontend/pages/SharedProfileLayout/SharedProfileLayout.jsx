import { Link, Outlet, useMatch } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContextProvider';
import styles from './SharedProfileLayout.module.css';

const SharedProfileLayout = () => {
  const { isAdmin } = useAuthContext();
  const isProfileActive = useMatch('/profile');
  const isAddressActive = useMatch('/profile/address');
  const isCurrencyActive = useMatch('/profile/currency');
  const isAdminPanelActive = useMatch('/profile/admin');

  const showActiveCSS = (isPageActive) => {
    return isPageActive ? styles.activeLinkCSS : styles.notActiveLinkCSS;
  };

  return (
    <section className={`half-page ${styles.pageCenter}`}>
      <main>
        <header>
          <Link className={showActiveCSS(isProfileActive)} to='/profile'>
            👤 Perfil
          </Link>

          {!isAdmin && (
            <Link
              className={showActiveCSS(isAddressActive)}
              to='/profile/address'
            >
              📍 Direcciones
            </Link>
          )}

          <Link
            className={showActiveCSS(isCurrencyActive)}
            to='/profile/currency'
          >
            💱 Monedas
          </Link>

          {isAdmin && (
            <Link
              className={showActiveCSS(isAdminPanelActive)}
              to='/profile/admin'
            >
              👑 Panel de Control
            </Link>
          )}
        </header>
        <hr />

        <Outlet />
      </main>
    </section>
  );
};

export default SharedProfileLayout;