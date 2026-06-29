import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './components/Login.jsx'
import Wydarzenia from './pages/Wydarzenia.jsx'
import EventForm from './pages/EventForm.jsx'
import Miesiac from './pages/Miesiac.jsx'
import Porownanie from './pages/Porownanie.jsx'
import KosztyMiesieczne from './pages/KosztyMiesieczne.jsx'
import Zobowiazania from './pages/Zobowiazania.jsx'
import Bilety from './pages/Bilety.jsx'

export default function App() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('panel.auth') === 'ok')
  if (!unlocked) return <Login onOk={() => setUnlocked(true)} />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/wydarzenia" replace />} />
        <Route path="/wydarzenia" element={<Wydarzenia />} />
        <Route path="/wydarzenia/nowe" element={<EventForm />} />
        <Route path="/wydarzenia/:id" element={<EventForm />} />
        <Route path="/miesiac" element={<Miesiac />} />
        <Route path="/porownanie" element={<Porownanie />} />
        <Route path="/koszty" element={<KosztyMiesieczne />} />
        <Route path="/zobowiazania" element={<Zobowiazania />} />
        <Route path="/bilety" element={<Bilety />} />
        <Route path="*" element={<Navigate to="/wydarzenia" replace />} />
      </Routes>
    </Layout>
  )
}
