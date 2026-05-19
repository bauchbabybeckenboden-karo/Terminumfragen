import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import styles from './MeineUmfragen.module.css'

function formatDatum(datum) {
  if (!datum) return ''
  const [y, m, d] = datum.split('-')
  return `${d}.${m}.${y}`
}

export default function MeineUmfragen() {
  const [umfragen, setUmfragen] = useState([])
  const [loading, setLoading] = useState(true)
  const [antworten, setAntworten] = useState({})
  const [offen, setOffen] = useState(null)
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('umfragen')
        .select('*')
        .order('created_at', { ascending: false })
      setUmfragen(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const loadAntworten = async (id) => {
    if (offen === id) { setOffen(null); return }
    setOffen(id)
    if (antworten[id]) return
    const { data } = await supabase
      .from('antworten')
      .select('*')
      .eq('umfrage_id', id)
      .order('created_at', { ascending: false })
    setAntworten(prev => ({ ...prev, [id]: data || [] }))
  }

  const copyLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/umfrage/${id}`)
    setShareMsg(id)
    setTimeout(() => setShareMsg(''), 2000)
  }

  const deleteUmfrage = async (id) => {
    if (!confirm('Umfrage wirklich löschen? Alle Antworten werden ebenfalls gelöscht.')) return
    await supabase.from('antworten').delete().eq('umfrage_id', id)
    await supabase.from('umfragen').delete().eq('id', id)
    setUmfragen(prev => prev.filter(u => u.id !== id))
  }

  if (loading) return (
    <div className={styles.center}>
      <p className={styles.loading}>Wird geladen …</p>
    </div>
  )

  if (umfragen.length === 0) return (
    <div className={styles.center}>
      <div className={styles.empty}>
        <span>◇</span>
        <h2>Noch keine Umfragen</h2>
        <p>Erstelle deine erste Terminumfrage.</p>
        <Link to="/erstellen" className={styles.createBtn}>Umfrage erstellen →</Link>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Meine Umfragen</h1>
        <Link to="/erstellen" className={styles.newBtn}>+ Neue Umfrage</Link>
      </div>

      <div className={styles.list}>
        {umfragen.map(u => (
          <div key={u.id} className={styles.umfrageCard}>
            <div className={styles.cardTop}>
              <div className={styles.cardInfo}>
                <h2>{u.titel}</h2>
                {u.ort && <p className={styles.ort}>📍 {u.ort}</p>}
                <p className={styles.meta}>{u.termine?.length || 0} Termine · {new Date(u.created_at).toLocaleDateString('de-DE')}</p>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => copyLink(u.id)}
                  title="Link kopieren"
                >
                  {shareMsg === u.id ? '✓' : '🔗'}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => deleteUmfrage(u.id)}
                  title="Löschen"
                >
                  ×
                </button>
              </div>
            </div>

            <button className={styles.antwortenToggle} onClick={() => loadAntworten(u.id)}>
              {offen === u.id ? '▲ Antworten verbergen' : '▼ Antworten anzeigen'}
            </button>

            {offen === u.id && (
              <div className={styles.antwortenSection}>
                {!antworten[u.id] ? (
                  <p className={styles.loadingAntworten}>Lädt …</p>
                ) : antworten[u.id].length === 0 ? (
                  <p className={styles.keineAntworten}>Noch keine Antworten.</p>
                ) : (
                  <div className={styles.antwortenList}>
                    {antworten[u.id].map((a, i) => (
                      <div key={i} className={styles.antwort}>
                        <div className={styles.antwortHeader}>
                          <strong>{a.name}</strong>
                          <span>{a.email}</span>
                        </div>
                        <div className={styles.antwortTermine}>
                          {a.termine.map((t, j) => (
                            <span key={j} className={styles.terminTag}>
                              {formatDatum(t.datum)} · {t.uhrzeit} Uhr
                            </span>
                          ))}
                        </div>
                        {a.anmerkung && <p className={styles.antwortAnmerkung}>„{a.anmerkung}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
