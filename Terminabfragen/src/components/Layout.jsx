import { Link, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img
            className={styles.logoImg}
            src="https://raw.githubusercontent.com/bauchbabybeckenboden-karo/Logos/main/Clitlogo-creme.png"
            alt="Wunderwerk Frau Logo"
          />
          <span className={styles.logoBlock}>
            <span className={styles.logoName}>Wunderwerk Frau</span>
            <span className={styles.logoLine}></span>
            <span className={styles.logoSub}>Bauch · Baby · Beckenboden</span>
            <span className={styles.logoTag}>Trageberatungen sowie Sport-, Beckenboden- &amp; somatische Yogakurse für Frauen</span>
          </span>
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
        <p>Wunderwerk Frau · Bauch · Baby · Beckenboden</p>
      </footer>
    </div>
  )
}
