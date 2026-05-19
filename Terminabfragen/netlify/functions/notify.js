const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { name, email, umfrage_titel, termine, anmerkung } = JSON.parse(event.body)

    const termineHTML = termine
      .map(t => {
        const [y, m, d] = t.datum.split('-')
        const datum = `${d}.${m}.${y}`
        return `<li style="margin-bottom:4px;">${datum} um ${t.uhrzeit} Uhr${t.anmerkung ? ` <em>(${t.anmerkung})</em>` : ''}</li>`
      })
      .join('')

    await resend.emails.send({
      from: 'Terminumfrage <kontakt@bauch-baby-beckenboden.com>',
      to: 'kontakt@bauch-baby-beckenboden.com',
      subject: `Neue Antwort: ${umfrage_titel}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; color: #3a2a28;">
          <h2 style="color: #7d534e; font-weight: 400;">Neue Teilnahme ♡</h2>
          <p><strong>Umfrage:</strong> ${umfrage_titel}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>E-Mail:</strong> ${email}</p>
          <p><strong>Zugesagte Termine:</strong></p>
          <ul style="padding-left: 1.2rem; color: #5c3b37;">${termineHTML}</ul>
          ${anmerkung ? `<p><strong>Anmerkung:</strong> <em>${anmerkung}</em></p>` : ''}
        </div>
      `
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    }
  } catch (err) {
    console.error('Resend error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
