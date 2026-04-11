import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/roadmap', label: 'Roadmap', icon: '🧭' },
  { to: '/projects', label: 'Projets', icon: '📦' },
  { to: '/links', label: 'Liens', icon: '🔗' }
]

export default function MobileNav() {
  return (
    <motion.nav initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="safe-bottom z-40 bg-transparent px-4 pb-2 pt-1.5 md:hidden">
      <div className="mx-auto flex max-w-xs items-center justify-between rounded-full border border-border-subtle/80 bg-[#121a2a]/95 px-2 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-w-[74px] flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium transition ${isActive ? 'bg-surface-elevated text-content' : 'text-content-muted'}`}>
            <span className="text-sm">{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
