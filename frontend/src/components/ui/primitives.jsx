import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

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

export function IconButton({ children, className = '', variant = 'ghost', label, tooltip, ...props }) {
  const ariaLabel = props['aria-label'] || label || tooltip
  const button = (
    <motion.button whileHover={{ scale: props.disabled ? 1 : 1.04 }} whileTap={{ scale: props.disabled ? 1 : 0.96 }} className={cn('icon-btn', `icon-btn-${variant}`, className)} aria-label={ariaLabel} {...props}>{children}</motion.button>
  )
  if (tooltip) return <Tooltip label={tooltip}>{button}</Tooltip>
  return button
}

export function ActionMenu({ label = 'Actions', items = [] }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, minWidth: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportPadding = 8
    const menuWidth = menuRef.current?.offsetWidth || 176
    const menuHeight = menuRef.current?.offsetHeight || 0

    let left = rect.right - menuWidth
    if (left < viewportPadding) left = viewportPadding
    if (left + menuWidth > window.innerWidth - viewportPadding) left = Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)

    let top = rect.bottom + 8
    if (menuHeight && top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, rect.top - menuHeight - 8)
    }

    setPosition({
      top,
      left,
      minWidth: rect.width
    })
  }, [])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const handlePointer = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, updatePosition])

  const menuContent = (
    <div ref={menuRef} className="w-44 rounded-xl border border-border-subtle bg-surface p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.4)]" style={{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, minWidth: `${position.minWidth}px`, zIndex: 'var(--z-dropdown)' }}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            item.onClick?.()
            setOpen(false)
          }}
          className={cn('flex w-full rounded-lg px-2.5 py-2 text-left text-xs transition', item.danger ? 'text-red-200 hover:bg-red-500/10' : 'text-content-muted hover:bg-surface-elevated hover:text-content')}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <button ref={triggerRef} type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen((current) => !current)} aria-haspopup="menu" aria-expanded={open}>
        {label}
      </button>
      {open && typeof document !== 'undefined' ? createPortal(menuContent, document.body) : null}
    </>
  )
}

export function Card({ className = '', children, ...rest }) {
  return <div className={cn('surface-card', className)} {...rest}>{children}</div>
}

export const Input = React.forwardRef(function Input(props, ref) { return <input ref={ref} className={cn('input-base', props.className)} {...props} /> })
export const Textarea = React.forwardRef(function Textarea(props, ref) { return <textarea ref={ref} className={cn('input-base min-h-[96px]', props.className)} {...props} /> })

export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
}

export function EmptyState({ icon, title, description, action }) {
  return <Card className="mx-auto flex max-w-xl flex-col items-center justify-center px-8 py-12 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated">{icon}</div><h3 className="text-lg font-semibold text-content">{title}</h3><p className="mt-2 max-w-md text-sm text-content-muted">{description}</p>{action ? <div className="mt-6">{action}</div> : null}</Card>
}

export function SectionHeader({ title, subtitle, actions }) {
  return <div className="mb-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight text-content">{title}</h1>{subtitle ? <p className="mt-1 text-sm text-content-muted">{subtitle}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</div>
}

export function Tooltip({ label, side = 'top', children }) {
  if (!label) return children
  return <span className={cn('tooltip-wrapper', `tooltip-${side}`)}>{children}<span className="tooltip-bubble" role="tooltip">{label}</span></span>
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => { if (!open) return undefined; const onKey = (event) => { if (event.key === 'Escape') onClose?.() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [open, onClose])
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}><motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.2 }} className={cn('modal-sheet', `modal-sheet-${size}`)}>{(title || description) ? <div className="border-b border-border-subtle px-6 pb-4 pt-5">{title ? <h2 className="text-lg font-semibold text-content">{title}</h2> : null}{description ? <p className="mt-1 text-sm text-content-muted">{description}</p> : null}</div> : null}<div className="modal-scroll px-6 py-5">{children}</div>{footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle px-6 py-4">{footer}</div> : null}</motion.div></motion.div>}</AnimatePresence>,
    document.body
  )
}

export function ConfirmDialog({ open, title = 'Confirmer cette action ?', description, details, confirmLabel = 'Supprimer', cancelLabel = 'Annuler', tone = 'danger', onConfirm, onClose, busy = false }) {
  const confirmVariant = tone === 'danger' ? 'danger' : tone === 'warning' ? 'secondary' : 'primary'
  return <Modal open={open} onClose={busy ? undefined : onClose} title={title} description={description} footer={[<Button key="cancel" variant="secondary" onClick={onClose} disabled={busy}>{cancelLabel}</Button>, <Button key="confirm" variant={confirmVariant} onClick={async () => { if (!busy) await onConfirm?.() }} disabled={busy}>{busy ? 'Traitement...' : confirmLabel}</Button>]}>{tone === 'danger' ? <div className="mb-3"><Badge tone="warning">Action irréversible</Badge></div> : null}{details?.length ? <ul className="mt-1 space-y-1.5 rounded-xl border border-border-subtle bg-surface-elevated/60 px-4 py-3 text-sm text-content-muted">{details.map((item, idx) => <li key={idx} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" /><span>{item}</span></li>)}</ul> : null}</Modal>
}

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const dismiss = useCallback((id) => { setToasts((current) => current.filter((toast) => toast.id !== id)); const timer = timers.current.get(id); if (timer) { clearTimeout(timer); timers.current.delete(id) } }, [])
  const push = useCallback((toast) => { const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; const duration = toast.duration ?? 3200; setToasts((current) => [...current, { id, tone: 'neutral', ...toast }]); if (duration > 0) { const timer = setTimeout(() => dismiss(id), duration); timers.current.set(id, timer) } return id }, [dismiss])
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); timers.current.clear() }, [])
  const value = React.useMemo(() => ({ push, dismiss, success: (message, opts) => push({ tone: 'success', message, ...opts }), error: (message, opts) => push({ tone: 'danger', message, ...opts }), info: (message, opts) => push({ tone: 'neutral', message, ...opts }) }), [push, dismiss])
  return <ToastContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite" aria-atomic="true"><AnimatePresence initial={false}>{toasts.map((toast) => <motion.div key={toast.id} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }} className={cn('toast', `toast-${toast.tone}`)} role="status"><div className="flex-1">{toast.title ? <p className="text-sm font-semibold text-content">{toast.title}</p> : null}<p className="text-sm text-content-muted">{toast.message}</p></div><button onClick={() => dismiss(toast.id)} className="icon-btn icon-btn-ghost shrink-0" aria-label="Fermer la notification"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></motion.div>)}</AnimatePresence></div></ToastContext.Provider>
}

export function useToast() { const ctx = useContext(ToastContext); if (!ctx) return { push: () => undefined, dismiss: () => undefined, success: () => undefined, error: () => undefined, info: () => undefined }; return ctx }
