import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import UmfrageErstellen from './pages/UmfrageErstellen.jsx'
import UmfrageTeilnehmen from './pages/UmfrageTeilnehmen.jsx'
import MeineUmfragen from './pages/MeineUmfragen.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/erstellen" element={<UmfrageErstellen />} />
        <Route path="/umfrage/:id" element={<UmfrageTeilnehmen />} />
        <Route path="/meine-umfragen" element={<MeineUmfragen />} />
      </Routes>
    </Layout>
  )
}
