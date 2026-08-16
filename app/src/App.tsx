import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Admin from './pages/Admin'
import { useDevToolsBlocker } from './hooks/useDevToolsBlocker'

export default function App() {
  useDevToolsBlocker();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
