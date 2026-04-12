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
    <motion.nav initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="mobile-nav-region safe-bottom safe-x z-40 md:hidden">
      <div className="mobile-nav-surface mx-auto flex w-full max-w-[20.5rem] items-center justify-between rounded-[1.4rem] px-1.5 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[6rem] flex-col items-center justify-center gap-0.5 rounded-[1.05rem] px-2 py-1.5 text-[11px] font-medium transition ${
                isActive ? 'bg-surface-elevated text-content' : 'text-content-muted'
              }`
            }
          >
            <span className="text-[1.05rem]" aria-hidden>{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
