import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '../../constants/constants';
import styles from './Footer.module.css';
import useAudio from '../../hooks/useAudio';

const Footer = () => {
  const presentYear = new Date().getFullYear();
  const handleSoundPausePlay = useAudio({ audioTrack: '/jetha-bg.mp3' });

  return (
    <section className={styles.footer}>
      <div className={styles.linksContainer}>
        {FOOTER_LINKS.map((singleLink) => (
          <Link key={singleLink.id} to={singleLink.url} target='_blank'>
            {singleLink.icon}
          </Link>
        ))}
      </div>

      <div className={styles.copyrightDiv}>
        <span>© {presentYear} </span>
        <div className={styles.jethaDiv}>
          <button onClick={handleSoundPausePlay} className={styles.nameBtn}>
            <span className="yero-shop-text">Yero Shop!</span>.
          </button>{' '}
          <div className={styles.tooltip}>⚠ Includes Music !!</div>
        </div>
        <span>All rights reserved</span>
      </div>
    </section>
  );
};

export default Footer;
