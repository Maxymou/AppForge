import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { to: '/roadmap', label: 'Roadmap', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { to: '/projects', label: 'Projets', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
  { to: '/links', label: 'Liens', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-2 2a4 4 0 11-5.656-5.656l1.5-1.5m4-4l2-2a4 4 0 115.656 5.656l-1.5 1.5"/></svg> }
]

export default function MobileNav() {
  return (
    <motion.nav
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="safe-bottom z-40 bg-transparent px-3 pb-1 pt-1.5 md:hidden"
    >
      <div className="mx-auto flex max-w-sm items-center justify-between rounded-full border border-border-subtle/80 bg-[#121a2a]/95 px-2 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex min-w-[82px] flex-col items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition ${isActive ? 'bg-surface-elevated text-content' : 'text-content-muted'}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
