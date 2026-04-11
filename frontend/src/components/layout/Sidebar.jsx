import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import { AppForgeBrand, Badge, Button } from '../ui/primitives'
import SettingsModal from './SettingsModal'

const navItems = [
  { to: '/roadmap', label: 'Roadmap', icon: '🧭' },
  { to: '/projects', label: 'Projets', icon: '📦' },
  { to: '/links', label: 'Liens', icon: '🔗' }
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <motion.aside initial={{ x: -32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.24 }} className="surface-panel flex h-full w-72 flex-col p-4">
      <div className="mb-6 border-b border-border-subtle pb-4"><AppForgeBrand /></div>
      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${isActive ? 'bg-surface-elevated text-content border border-border-subtle' : 'text-content-muted hover:bg-surface-elevated/70 hover:text-content'}`}>
            <span>{item.icon}</span><span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border-subtle pt-4">
        <div className="surface-card flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-content">{user?.email || 'Admin'}</p><Badge className="mt-1">Espace de travail</Badge></div>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => setShowSettings(true)}>Paramètres du compte</Button>
      </div>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </motion.aside>
  )
}
