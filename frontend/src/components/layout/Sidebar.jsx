import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import { AppForgeBrand, Badge, IconButton } from '../ui/primitives'

const navItems = [
  { to: '/roadmap', label: 'Roadmap', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { to: '/projects', label: 'Projects', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> }
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <motion.aside initial={{ x: -32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.24 }} className="surface-panel flex h-full w-72 flex-col p-4">
      <div className="mb-6 border-b border-border-subtle pb-4">
        <AppForgeBrand />
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${isActive ? 'bg-surface-elevated text-content border border-border-subtle' : 'text-content-muted hover:bg-surface-elevated/70 hover:text-content'}`}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-indigo-300' : 'text-content-muted group-hover:text-content'}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border-subtle pt-4">
        <div className="surface-card flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content">{user?.email || 'Admin'}</p>
            <Badge className="mt-1">Workspace</Badge>
          </div>
          <IconButton onClick={() => { logout(); navigate('/login') }} title="Sign out">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </IconButton>
        </div>
      </div>
    </motion.aside>
  )
}
