# Bauch · Baby · Beckenboden — Terminumfrage

## Setup

### 1. Supabase
1. Konto erstellen auf supabase.com → neues Projekt
2. Im SQL Editor den Inhalt von `supabase-setup.sql` ausführen
3. Under Settings → API: URL und anon key kopieren

### 2. EmailJS (Bestätigung an Teilnehmerin)
1. Konto auf emailjs.com erstellen
2. Service verbinden (z.B. iCloud)
3. Template erstellen mit diesen Variablen:
   - `{{to_name}}` — Name der Teilnehmerin
   - `{{umfrage_titel}}` — Titel der Umfrage
   - `{{umfrage_ort}}` — Ort
   - `{{termine_liste}}` — Liste der Termine (mehrzeilig)
   - `{{anmerkung}}` — Anmerkung der Teilnehmerin
4. Service ID, Template ID und Public Key notieren

### 3. Resend (Benachrichtigung an dich)
1. Konto auf resend.com erstellen
2. API Key erstellen
3. Domain verifizieren ODER beim kostenlosen Plan: `from` in notify.js auf deine verifizierte Adresse anpassen

### 4. Netlify deployen
1. Diesen Ordner auf GitHub pushen
2. Netlify → New site from Git → Repo auswählen
3. Build settings: `npm run build` / publish: `dist`
4. Environment Variables in Netlify setzen:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
RESEND_API_KEY=...
VITE_NOTIFY_EMAIL=bauch.baby.becken@icloud.com
```

5. Deploy!

### Logo einbinden
Lade dein Logo als `logo.svg` oder `logo.png` in den `public/` Ordner.
Dann in `src/components/Layout.jsx` die Zeile mit `.logoText` ersetzen durch:
```jsx
<img src="/logo.svg" alt="Bauch Baby Beckenboden" style={{height: '32px'}} />
```
