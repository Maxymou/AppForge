import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from './stores/authStore'
import LoginPage from './components/auth/LoginPage'
import Sidebar from './components/layout/Sidebar'
import MobileNav from './components/layout/MobileNav'
import RoadmapView from './components/roadmap/RoadmapView'
import ProjectList from './components/projects/ProjectList'
import FlowCanvas from './components/projects/FlowCanvas'
import LinksView from './components/layout/LinksView'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

const pageTransition = {
  duration: 0.22,
  ease: 'easeOut'
}

/**
 * ProtectedLayout
 * ---------------
 * The outermost shell of the authenticated area. It uses .app-viewport so
 * it is anchored to the stable --app-height on mobile (and degrades to a
 * normal flex column on desktop via the CSS media query).
 *
 * Mobile: Sidebar is hidden, MobileNav is rendered INSIDE the column and
 * paints the bottom safe area via .safe-bottom, so the home-indicator zone
 * stays painted in brand color (no white leak).
 *
 * Desktop (>= md): Sidebar gets its own rail on the left, MobileNav is gone.
 */
function ProtectedLayout({ children }) {
  return (
    // .app-viewport = stable fullscreen shell anchored on --app-height.
    // Flex direction stays the default (row) so the sidebar sits next to
    // the main column on desktop. On mobile the sidebar is hidden, so the
    // single <main> child expands to fill the entire stable viewport.
    <div className="app-viewport shell">
      <aside className="hidden md:flex md:px-3 md:py-3">
        <Sidebar />
      </aside>

      <main className="safe-x flex min-w-0 flex-1 flex-col overflow-hidden md:px-0 md:py-3 md:pr-3">
        <div className="surface-card flex min-h-0 flex-1 overflow-hidden rounded-none border-x-0 border-t-0 md:rounded-2xl md:border">
          {children}
        </div>
        <MobileNav />
      </main>
    </div>
  )
}

function RequireAuth({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  const { token } = useAuthStore()

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/roadmap" replace />
            ) : (
              <motion.div key="login" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-full">
                <LoginPage />
              </motion.div>
            )
          }
        />

        <Route path="/" element={<RequireAuth><Navigate to="/roadmap" replace /></RequireAuth>} />

        <Route
          path="/roadmap"
          element={<RequireAuth><ProtectedLayout><motion.div key="roadmap" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-full"><RoadmapView /></motion.div></ProtectedLayout></RequireAuth>}
        />

        <Route
          path="/projects"
          element={<RequireAuth><ProtectedLayout><motion.div key="projects" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-full"><ProjectList /></motion.div></ProtectedLayout></RequireAuth>}
        />


        <Route
          path="/links"
          element={<RequireAuth><ProtectedLayout><motion.div key="links" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-full"><LinksView /></motion.div></ProtectedLayout></RequireAuth>}
        />

        <Route
          path="/projects/:id"
          element={<RequireAuth><ProtectedLayout><motion.div key="flow-canvas" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition} className="h-full"><FlowCanvas /></motion.div></ProtectedLayout></RequireAuth>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
