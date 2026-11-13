// Schützt die Admin-Seiten (Umfrage erstellen/bearbeiten, Meine Umfragen) mit
// Karos Login (gleiches Supabase-Konto wie im Buchungstool).
// WICHTIG: Das hier ist nur die Anzeige. Die eigentliche Absicherung passiert
// in der Datenbank (RLS): Antworten lesen und Umfragen anlegen/ändern/löschen
// darf nur Karos Login, egal was im Browser passiert.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

const box = {
  maxWidth: 380,
  margin: '3rem auto',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
}
const feld = {
  padding: '0.65rem 0.9rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '1rem',
  fontFamily: 'var(--font-body)',
}
const knopf = {
  background: 'var(--rosewood)',
  color: 'var(--cream)',
  border: 'none',
  borderRadius: 50,
  padding: '0.7rem 1.4rem',
  fontSize: '0.95rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

export default function AdminGate({ children }) {
  const [session, setSession] = useState(undefined)
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [fehler, setFehler] = useState('')
  const [laedt, setLaedt] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, neu) => setSession(neu))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function anmelden(e) {
    e.preventDefault()
    setLaedt(true)
    setFehler('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: passwort })
    setLaedt(false)
    if (error) setFehler('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.')
  }

  if (session === undefined) {
    return <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Wird geladen …</p>
  }

  if (!session) {
    return (
      <form onSubmit={anmelden} style={box}>
        <h1 style={{ color: 'var(--rosewood)', fontSize: '1.8rem', textAlign: 'center' }}>Admin-Login</h1>
        <input style={feld} type="email" placeholder="E-Mail" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={feld} type="password" placeholder="Passwort" autoComplete="current-password" value={passwort} onChange={(e) => setPasswort(e.target.value)} required />
        {fehler && <p style={{ color: '#a33', fontSize: '0.9rem' }}>{fehler}</p>}
        <button style={knopf} type="submit" disabled={laedt}>{laedt ? 'Anmelden …' : 'Anmelden'}</button>
      </form>
    )
  }

  return (
    <>
      {children}
      <div style={{ textAlign: 'right', marginTop: '2rem' }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ ...knopf, background: 'transparent', color: 'var(--rosewood)', border: '1px solid var(--border)', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
        >
          Abmelden
        </button>
      </div>
    </>
  )
}
