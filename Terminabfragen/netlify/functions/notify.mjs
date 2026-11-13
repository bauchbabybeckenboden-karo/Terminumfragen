// netlify/functions/notify.mjs
// Info-Mail an Karo, wenn jemand an einer Terminumfrage teilgenommen hat.
//
// SICHERHEIT: Der Browser schickt nur die ID der Umfrage. Name, Termine usw.
// liest die Funktion selbst aus der Datenbank (nur Antworten der letzten
// 15 Minuten, die noch nicht gemeldet wurden). Empfängerin ist immer Karo.
// So kann niemand über diese Funktion Mails mit eigenem Inhalt verschicken,
// und jede Antwort wird genau einmal gemeldet (Spalte antworten.benachrichtigt_at).
//
// Netlify-Umgebungsvariablen: RESEND_API_KEY (Resend "Wunderwerk Frau"),
// VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (nur Scope "Functions").

import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const KONTAKT_EMAIL = "kontakt@wunderwerk-frau.de";
const FROM = `"Terminumfrage · Wunderwerk Frau" <${KONTAKT_EMAIL}>`;
const ADMIN_EMAIL = "kontakt@bauch-baby-beckenboden.com";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(daten, status = 200) {
  return new Response(JSON.stringify(daten), { status, headers: { "Content-Type": "application/json" } });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatDatum(iso) {
  const [y, m, d] = String(iso || "").split("-");
  return d ? `${d}.${m}.${y}` : "";
}

function mailHtml(umfrage, a) {
  const termine = Array.isArray(a.termine) && a.termine.length
    ? `<ul style="margin:0;padding-left:18px;">${a.termine
        .map((t) => `<li>${formatDatum(t.datum)} um ${escapeHtml(t.uhrzeit)} Uhr${t.anmerkung ? ` <em>(${escapeHtml(t.anmerkung)})</em>` : ""}</li>`)
        .join("")}</ul>`
    : "<em>kein Termin passend</em>";
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 8px;">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;font-family:Arial,Helvetica,sans-serif;">
<tr><td bgcolor="#8B6464" style="background-color:#8B6464;padding:20px 28px;color:#F3E9E5;">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#F3E9E5;">Terminumfrage</p>
<p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#F3E9E5;">Neue Teilnahme &#9825;</p>
</td></tr>
<tr><td bgcolor="#F3E9E5" style="background-color:#F3E9E5;padding:24px 28px;color:#3D2B2B;font-size:14px;line-height:1.7;">
<p style="margin:0 0 10px;"><strong>Umfrage:</strong> ${escapeHtml(umfrage?.titel || "")}</p>
<p style="margin:0 0 10px;"><strong>Name:</strong> ${escapeHtml(a.name)}</p>
<p style="margin:0 0 10px;"><strong>E-Mail:</strong> <a href="mailto:${escapeHtml(a.email)}" style="color:#8B6464;">${escapeHtml(a.email)}</a></p>
<p style="margin:0 0 6px;"><strong>Termine:</strong></p>
${termine}
${a.anmerkung ? `<p style="margin:12px 0 0;"><strong>Anmerkung:</strong> <em>${escapeHtml(a.anmerkung)}</em></p>` : ""}
</td></tr></table></td></tr></table>`;
}

export default async (req) => {
  if (req.method !== "POST") return new Response("POST erwartet", { status: 405 });
  if (!RESEND_API_KEY || !supabaseAdmin) {
    console.error("[notify] RESEND_API_KEY oder Supabase-Zugang fehlt");
    return json({ error: "Nicht eingerichtet" }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const umfrageId = String(body?.umfrage_id || "");
  if (!UUID_RE.test(umfrageId)) return json({ error: "Ungültige Anfrage" }, 400);

  try {
    const seit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: offen, error } = await supabaseAdmin
      .from("antworten")
      .select("*")
      .eq("umfrage_id", umfrageId)
      .is("benachrichtigt_at", null)
      .gte("created_at", seit)
      .order("created_at", { ascending: true })
      .limit(5);
    if (error) throw new Error(`Antworten laden: ${error.message}`);
    if (!offen || offen.length === 0) return json({ ok: true, gemeldet: 0 });

    const { data: umfrage } = await supabaseAdmin.from("umfragen").select("titel").eq("id", umfrageId).maybeSingle();

    let gemeldet = 0;
    for (const a of offen) {
      // Erst markieren, dann senden - so wird nichts doppelt gemeldet
      const { data: markiert } = await supabaseAdmin
        .from("antworten")
        .update({ benachrichtigt_at: new Date().toISOString() })
        .eq("id", a.id)
        .is("benachrichtigt_at", null)
        .select("id");
      if (!markiert || markiert.length === 0) continue;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `umfrage-antwort-${a.id}` },
        body: JSON.stringify({
          from: FROM,
          to: [ADMIN_EMAIL],
          reply_to: a.email || KONTAKT_EMAIL,
          subject: `Neue Antwort: ${umfrage?.titel || "Terminumfrage"} – ${a.name}`,
          html: mailHtml(umfrage, a),
        }),
      });
      if (res.ok) {
        gemeldet++;
      } else {
        console.error("[notify] Resend", res.status, await res.text());
        await supabaseAdmin.from("antworten").update({ benachrichtigt_at: null }).eq("id", a.id);
      }
    }
    return json({ ok: true, gemeldet });
  } catch (e) {
    console.error("[notify] Fehler:", e);
    return json({ error: "Interner Fehler" }, 500);
  }
};

export const config = { path: "/.netlify/functions/notify" };
