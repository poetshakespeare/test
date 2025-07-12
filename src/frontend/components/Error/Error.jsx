import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Error.module.css';

const Error = ({ errorText }) => {
  return (
    <div className={`half-page container ${styles.error}`}>
      <h3>{errorText}</h3>

      <div className={styles.imgContainer}>
        <div className={styles.errorIcon}>❌</div>
      </div>

      <Link to='/' className='btn btn-padding-desktop'>
        Volver al Inicio
      </Link>
    </div>
  );
};

export default Error;