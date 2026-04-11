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
    <motion.nav initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="safe-bottom safe-x z-40 bg-transparent px-3 pb-2 pt-1 md:hidden">
      <div className="mx-auto flex w-full max-w-[19.5rem] items-center justify-between rounded-[1.4rem] border border-border-subtle/80 bg-[#121a2a]/92 px-1.5 py-1 shadow-[0_14px_34px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-w-[5.8rem] flex-col items-center gap-0.5 rounded-[1.05rem] px-2 py-1.5 text-[10px] font-medium transition ${isActive ? 'bg-surface-elevated text-content' : 'text-content-muted'}`}>
            <span className="text-[0.95rem]">{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
