import { Link } from 'react-router-dom';
import Title from '../Title/Title';

import styles from './EmptyList.module.css';

const EmptyList = ({ listName }) => {
  return (
    <main className='half-page'>
      <Title>{listName}</Title>

      <p className={`text-center ${styles.emptyText}`}>
        Tu {listName} está vacío! ☹️
      </p>

      <Link to='/products' className='btn btn-center'>
        Explorar
      </Link>
    </main>
  );
};

export default EmptyList;