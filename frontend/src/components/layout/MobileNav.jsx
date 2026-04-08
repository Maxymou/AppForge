import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../../stores/authStore'

const navItems = [
  {
    to: '/roadmap',
    label: 'Roadmap',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  }
]

export default function MobileNav() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="bg-slate-800 border-t border-slate-700 flex items-center justify-around px-4 py-2 safe-area-bottom"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive ? 'text-blue-400' : 'text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.span
                whileTap={{ scale: 0.9 }}
                className={isActive ? 'text-blue-400' : 'text-slate-400'}
              >
                {item.icon}
              </motion.span>
              <span className="text-xs font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-slate-400"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-xs font-medium">Logout</span>
      </motion.button>
    </motion.nav>
  )
}
