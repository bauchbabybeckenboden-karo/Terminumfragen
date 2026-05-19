import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import styles from './UmfrageErstellen.module.css'

const emptyTermin = () => ({ datum: '', uhrzeit: '', anmerkung: '' })

export default function UmfrageErstellen() {
  const navigate = useNavigate()
  const [titel, setTitel] = useState('')
  const [ort, setOrt] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [termine, setTermine] = useState([emptyTermin()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addTermin = () => setTermine([...termine, emptyTermin()])

  const removeTermin = (i) => {
    if (termine.length === 1) return
    setTermine(termine.filter((_, idx) => idx !== i))
  }

  const updateTermin = (i, field, value) => {
    setTermine(termine.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  const handleSubmit = async () => {
    if (!titel.trim()) { setError('Bitte einen Titel eingeben.'); return }
    const validTermine = termine.filter(t => t.datum && t.uhrzeit)
    if (validTermine.length === 0) { setError('Bitte mindestens einen vollständigen Termin angeben.'); return }

    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('umfragen')
      .insert([{ titel, ort, beschreibung, termine: validTermine }])
      .select()
      .single()

    if (dbError) {
      setError('Fehler beim Speichern. Bitte versuche es erneut.')
      setLoading(false)
      return
    }

    navigate(`/umfrage/${data.id}?neu=1`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Neue Terminumfrage</h1>
        <p>Erstelle eine Umfrage und teile den Link mit deinen Teilnehmerinnen.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>✦</span>
          <h2>Umfrage-Details</h2>
        </div>

        <div className={styles.field}>
          <label>TITEL DER UMFRAGE</label>
          <input
            type="text"
            placeholder="z.B. Somatic Yoga Frühjahr 2025"
            value={titel}
            onChange={e => setTitel(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>ORT / VERANSTALTUNGSORT</label>
          <input
            type="text"
            placeholder="z.B. Studio Mitte, Musterstraße 4, Berlin"
            value={ort}
            onChange={e => setOrt(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>BESCHREIBUNG</label>
          <textarea
            placeholder="Was erwartet die Teilnehmerinnen?"
            value={beschreibung}
            onChange={e => setBeschreibung(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>◇</span>
          <h2>Terminvorschläge</h2>
        </div>

        {termine.map((termin, i) => (
          <div key={i} className={styles.terminSlot}>
            <div className={styles.terminRow}>
              <div className={styles.field}>
                <label>DATUM</label>
                <input
                  type="date"
                  value={termin.datum}
                  onChange={e => updateTermin(i, 'datum', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label>UHRZEIT</label>
                <input
                  type="time"
                  value={termin.uhrzeit}
                  onChange={e => updateTermin(i, 'uhrzeit', e.target.value)}
                />
              </div>
              {termine.length > 1 && (
                <button className={styles.removeBtn} onClick={() => removeTermin(i)} title="Entfernen">×</button>
              )}
            </div>
            <div className={styles.field}>
              <label>ANMERKUNG (SICHTBAR FÜR TEILNEHMERINNEN)</label>
              <input
                type="text"
                placeholder="z.B. Für Fortgeschrittene, bitte Matte mitbringen"
                value={termin.anmerkung}
                onChange={e => updateTermin(i, 'anmerkung', e.target.value)}
              />
            </div>
          </div>
        ))}

        <button className={styles.addBtn} onClick={addTermin}>
          + Termin hinzufügen
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Wird erstellt …' : 'Umfrage erstellen →'}
      </button>
    </div>
  )
}
