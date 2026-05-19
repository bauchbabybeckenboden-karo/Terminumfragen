import { Link, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoHeart}>♡</span>
          <span className={styles.logoText}>Bauch · Baby · Beckenboden</span>
          <span className={styles.logoHeart}>♡</span>
        </Link>
        <nav className={styles.nav}>
          <Link
            to="/erstellen"
            className={`${styles.navBtn} ${location.pathname === '/erstellen' ? styles.active : ''}`}
          >
            Umfrage erstellen
          </Link>
          <Link
            to="/meine-umfragen"
            className={`${styles.navLink} ${location.pathname === '/meine-umfragen' ? styles.active : ''}`}
          >
            Meine Umfragen
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>♡ Bauch · Baby · Beckenboden</p>
      </footer>
    </div>
  )
}
