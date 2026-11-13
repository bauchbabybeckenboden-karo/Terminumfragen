import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AdminGate from './components/AdminGate.jsx'
import Home from './pages/Home.jsx'
import UmfrageErstellen from './pages/UmfrageErstellen.jsx'
import UmfrageTeilnehmen from './pages/UmfrageTeilnehmen.jsx'
import MeineUmfragen from './pages/MeineUmfragen.jsx'

// Öffentlich: Startseite und die Umfrage selbst (/umfrage/:id) für Teilnehmerinnen.
// Nur mit Karos Login: Umfrage erstellen/bearbeiten und Meine Umfragen.
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/erstellen" element={<AdminGate><UmfrageErstellen /></AdminGate>} />
        <Route path="/umfrage/:id/bearbeiten" element={<AdminGate><UmfrageErstellen /></AdminGate>} />
        <Route path="/umfrage/:id" element={<UmfrageTeilnehmen />} />
        <Route path="/meine-umfragen" element={<AdminGate><MeineUmfragen /></AdminGate>} />
      </Routes>
    </Layout>
  )
}
