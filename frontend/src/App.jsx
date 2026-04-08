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

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const pageTransition = {
  duration: 0.2,
  ease: 'easeInOut'
}

function ProtectedLayout({ children }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-900">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        {/* Mobile nav */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </main>
    </div>
  )
}

function RequireAuth({ children }) {
  const { token } = useAuthStore()
  if (!token) {
    return <Navigate to="/login" replace />
  }
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
              <motion.div
                key="login"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="h-full"
              >
                <LoginPage />
              </motion.div>
            )
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/roadmap" replace />
            </RequireAuth>
          }
        />

        <Route
          path="/roadmap"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <motion.div
                  key="roadmap"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                  className="h-full"
                >
                  <RoadmapView />
                </motion.div>
              </ProtectedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/projects"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <motion.div
                  key="projects"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                  className="h-full"
                >
                  <ProjectList />
                </motion.div>
              </ProtectedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <motion.div
                  key="flow-canvas"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                  className="h-full"
                >
                  <FlowCanvas />
                </motion.div>
              </ProtectedLayout>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
