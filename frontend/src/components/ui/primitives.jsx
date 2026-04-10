import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function AppForgeBrand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="app-logo">
        <span className="app-logo__inner">AF</span>
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-content">AppForge</p>
          <p className="text-xs text-content-muted">Product Architecture</p>
        </div>
      )}
    </div>
  )
}

export function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.015 }}
      whileTap={{ scale: props.disabled ? 1 : 0.985 }}
      className={cn('btn', `btn-${variant}`, `btn-${size}`, className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function IconButton({ children, className = '', variant = 'ghost', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.04 }}
      whileTap={{ scale: props.disabled ? 1 : 0.96 }}
      className={cn('icon-btn', `icon-btn-${variant}`, className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function Card({ className = '', children }) {
  return <div className={cn('surface-card', className)}>{children}</div>
}

export function Panel({ className = '', children }) {
  return <div className={cn('surface-panel', className)}>{children}</div>
}

export const Input = React.forwardRef(function Input(props, ref) {
  return <input ref={ref} className={cn('input-base', props.className)} {...props} />
})

export const Textarea = React.forwardRef(function Textarea(props, ref) {
  return <textarea ref={ref} className={cn('input-base min-h-[96px]', props.className)} {...props} />
})

export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-center justify-center px-8 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-content">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-content-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  )
}

export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-content-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * Modal
 * -----
 * Built on top of the .modal-overlay / .modal-sheet / .modal-scroll classes,
 * which anchor the sheet to --app-height instead of 100vh / 90dvh. This
 * means the modal never collides with the iOS keyboard nor the home
 * indicator, and behaves correctly in a PWA fullscreen context.
 *
 * The inner body is made scrollable by default so long content (e.g. a
 * textarea in the project import modal) never pushes the footer off-screen.
 */
export function Modal({ open, onClose, title, description, children, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="modal-sheet"
          >
            {(title || description) ? (
              <div className="border-b border-border-subtle px-6 pb-4 pt-5">
                {title ? <h2 className="text-lg font-semibold text-content">{title}</h2> : null}
                {description ? <p className="mt-1 text-sm text-content-muted">{description}</p> : null}
              </div>
            ) : null}
            <div className="modal-scroll px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex flex-wrap gap-2 border-t border-border-subtle px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
