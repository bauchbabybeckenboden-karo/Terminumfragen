import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { supabase } from '../supabase.js'
import styles from './UmfrageTeilnehmen.module.css'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

function formatDatum(datum) {
  if (!datum) return ''
  const [y, m, d] = datum.split('-')
  return `${d}.${m}.${y}`
}

export default function UmfrageTeilnehmen() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isNeu = searchParams.get('neu') === '1'

  const [umfrage, setUmfrage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ausgewählt, setAusgewählt] = useState([])
  const [keinTermin, setKeinTermin] = useState(false)
  const [anmerkung, setAnmerkung] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('umfragen')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setUmfrage(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const toggleTermin = (i) => {
    if (keinTermin) return
    setAusgewählt(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  const toggleKeinTermin = () => {
    setKeinTermin(prev => {
      if (!prev) setAusgewählt([])
      return !prev
    })
  }

  const shareLink = `${window.location.origin}/umfrage/${id}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setShareMsg('Link kopiert!')
    setTimeout(() => setShareMsg(''), 2000)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Bitte gib deinen Namen ein.'); return }
    if (!email.trim()) { setError('Bitte gib deine E-Mail-Adresse ein.'); return }
    if (!keinTermin && ausgewählt.length === 0) { setError('Bitte wähle mindestens einen Termin aus.'); return }

    setSubmitting(true)
    setError('')

    const gewählteTermine = keinTermin ? [] : ausgewählt.map(i => umfrage.termine[i])

    const { error: dbError } = await supabase
      .from('antworten')
      .insert([{
        umfrage_id: id,
        name,
        email,
        termine: gewählteTermine,
        anmerkung: keinTermin ? 'Kein Termin passend' : anmerkung
      }])

    if (dbError) {
      setError('Fehler beim Speichern. Bitte versuche es erneut.')
      setSubmitting(false)
      return
    }

    if (!keinTermin) {
      const termineText = gewählteTermine
        .map(t => `• ${formatDatum(t.datum)} um ${t.uhrzeit} Uhr${t.anmerkung ? ` (${t.anmerkung})` : ''}`)
        .join('\n')

      try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          to_name: name,
          to_email: email,
          umfrage_titel: umfrage.titel,
          umfrage_ort: umfrage.ort || '',
          termine_liste: termineText,
          anmerkung: anmerkung || '–',
        }, PUBLIC_KEY)
      } catch (e) {
        console.warn('EmailJS Fehler:', e)
      }
    }

    try {
      await fetch('/.netlify/functions/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          umfrage_titel: umfrage.titel,
          termine: gewählteTermine,
          anmerkung: keinTermin ? 'Kein Termin passend' : anmerkung,
          kein_termin: keinTermin
        })
      })
    } catch (e) {
      console.warn('Notify Fehler:', e)
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className={styles.center}>
      <p className={styles.loading}>Wird geladen …</p>
    </div>
  )

  if (notFound) return (
    <div className={styles.center}>
      <div className={styles.notFound}>
        <span>◇</span>
        <h2>Umfrage nicht gefunden</h2>
        <p>Der Link ist möglicherweise abgelaufen oder ungültig.</p>
      </div>
    </div>
  )

  if (isNeu && !submitted) return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✦</div>
        <h1>Umfrage erstellt!</h1>
        <p>Teile diesen Link mit deinen Teilnehmerinnen:</p>
        <div className={styles.linkBox}>
          <span className={styles.linkText}>{shareLink}</span>
          <button className={styles.copyBtn} onClick={copyLink}>
            {shareMsg || 'Kopieren'}
          </button>
        </div>
        <p className={styles.hint}>Du kannst die Umfrage unter „Meine Umfragen" jederzeit wieder aufrufen.</p>
      </div>

      <div className={styles.preview}>
        <h2 className={styles.previewTitle}>Vorschau — so sehen es deine Teilnehmerinnen</h2>
        <UmfrageFormular umfrage={umfrage} preview />
      </div>
    </div>
  )

  if (submitted) return (
    <div className={styles.center}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>♡</div>
        <h2>Vielen Dank!</h2>
        <p>
          {keinTermin
            ? 'Schade, dass es diesmal nicht klappt — ich hoffe, wir sehen uns beim nächsten Kurs!'
            : 'Deine Antwort wurde gespeichert. Du erhältst gleich eine Bestätigung per E-Mail.'}
        </p>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <UmfrageFormular
        umfrage={umfrage}
        name={name} setName={setName}
        email={email} setEmail={setEmail}
        ausgewählt={ausgewählt} toggleTermin={toggleTermin}
        keinTermin={keinTermin} toggleKeinTermin={toggleKeinTermin}
        anmerkung={anmerkung} setAnmerkung={setAnmerkung}
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function UmfrageFormular({
  umfrage, preview = false,
  name, setName, email, setEmail,
  ausgewählt = [], toggleTermin,
  keinTermin, toggleKeinTermin,
  anmerkung, setAnmerkung,
  error, submitting, onSubmit
}) {
  function formatDatum(datum) {
    if (!datum) return ''
    const [y, m, d] = datum.split('-')
    return `${d}.${m}.${y}`
  }

  return (
    <div className={styles.formular}>
      <div className={styles.umfrageHeader}>
        <h1 className={styles.umfrageTitel}>{umfrage.titel}</h1>
        {umfrage.ort && <p className={styles.umfrageOrt}>📍 {umfrage.ort}</p>}
        {umfrage.beschreibung && <p className={styles.umfrageBeschreibung}>{umfrage.beschreibung}</p>}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span>◇</span>
          <h2>Terminvorschläge</h2>
        </div>
        <p className={styles.hinweis}>Wähle alle Termine aus, an denen du teilnehmen kannst.</p>
        <div className={`${styles.termine} ${keinTermin ? styles.termineDisabled : ''}`}>
          {umfrage.termine.map((t, i) => (
            <button
              key={i}
              className={`${styles.terminCard} ${ausgewählt.includes(i) ? styles.selected : ''} ${keinTermin ? styles.disabled : ''}`}
              onClick={() => !preview && toggleTermin(i)}
              disabled={preview || keinTermin}
            >
              <div className={styles.terminDatum}>{formatDatum(t.datum)}</div>
              <div className={styles.terminUhrzeit}>{t.uhrzeit} Uhr</div>
              {t.anmerkung && <div className={styles.terminAnmerkung}>{t.anmerkung}</div>}
              <div className={styles.terminCheck}>{ausgewählt.includes(i) ? '✓' : ''}</div>
            </button>
          ))}
        </div>

        {!preview && (
          <label className={styles.keinTerminLabel}>
            <input
              type="checkbox"
              checked={keinTermin || false}
              onChange={toggleKeinTermin}
              className={styles.keinTerminCheckbox}
            />
            Ich kann leider bei keinem der Termine dabei sein.
          </label>
        )}
      </div>

      {!preview && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>✦</span>
              <h2>Deine Angaben</h2>
            </div>
            <div className={styles.field}>
              <label>NAME</label>
              <input type="text" placeholder="Dein Name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>E-MAIL</label>
              <input type="email" placeholder="deine@email.de" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            {!keinTermin && (
              <div className={styles.field}>
                <label>ANMERKUNG (OPTIONAL)</label>
                <textarea placeholder="Hast du noch etwas mitzuteilen?" value={anmerkung} onChange={e => setAnmerkung(e.target.value)} rows={2} />
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Wird gesendet …' : 'Antwort absenden →'}
          </button>
        </>
      )}
    </div>
  )
}
/* append to UmfrageTeilnehmen.module.css */
