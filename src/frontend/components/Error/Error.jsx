import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Error.module.css';
const errorImg = '/jethalal-error.png';

const Error = ({ errorText }) => {
  return (
    <div className={`half-page container ${styles.error}`}>
      <h3>{errorText}</h3>

      <div className={styles.imgContainer}>
        <img src={errorImg} alt='error' />
      </div>

      <Link to='/' className='btn btn-padding-desktop'>
        Volver al Inicio
      </Link>
    </div>
  );
};

export default Error;