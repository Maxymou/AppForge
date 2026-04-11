import React from 'react'
import { ActionMenu, Button, cn } from '../ui/primitives'

export default function MobileHeader({
  title,
  subtitle,
  backAction,
  primaryAction,
  secondaryActions = [],
  menuActions = [],
  className = ''
}) {
  return (
    <header className={cn('safe-top border-b border-border-subtle bg-secondary/95 px-4 pb-3 pt-2 backdrop-blur md:hidden', className)}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {backAction ? (
              <button type="button" onClick={backAction.onClick} className="mb-1 inline-flex items-center gap-1 text-xs text-content-muted">
                <span aria-hidden>←</span>
                <span>{backAction.label || 'Retour'}</span>
              </button>
            ) : null}
            <h1 className="truncate text-base font-semibold text-content">{title}</h1>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-content-muted">{subtitle}</p> : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {secondaryActions.map((action) => (
              <Button key={action.key} size="sm" variant={action.variant || 'secondary'} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            {primaryAction ? (
              <Button size="sm" onClick={primaryAction.onClick} variant={primaryAction.variant || 'primary'}>
                {primaryAction.label}
              </Button>
            ) : null}
            {menuActions.length ? <ActionMenu label="Plus" items={menuActions} /> : null}
          </div>
        </div>
      </div>
    </header>
  )
}
