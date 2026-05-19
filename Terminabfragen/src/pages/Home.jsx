import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Terminumfrage</h1>
        <p className={styles.subtitle}>
          Erstelle eine Umfrage und teile den Link mit deinen Teilnehmerinnen.
        </p>
      </div>
      <div className={styles.cards}>
        <Link to="/erstellen" className={styles.card}>
          <span className={styles.cardIcon}>✦</span>
          <h2>Neue Umfrage erstellen</h2>
          <p>Lege Termine an und erhalte Rückmeldungen deiner Teilnehmerinnen.</p>
          <span className={styles.cardArrow}>→</span>
        </Link>
        <Link to="/meine-umfragen" className={styles.card}>
          <span className={styles.cardIcon}>◇</span>
          <h2>Meine Umfragen</h2>
          <p>Sieh dir bestehende Umfragen und die bisherigen Antworten an.</p>
          <span className={styles.cardArrow}>→</span>
        </Link>
      </div>
    </div>
  )
}
