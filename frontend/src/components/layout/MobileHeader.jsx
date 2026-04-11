import React from 'react'
import { ActionMenu, Button } from '../ui/primitives'

export default function MobileHeader({ title, actions = [], menuActions = [] }) {
  return (
    <div className="safe-top border-b border-border-subtle bg-secondary px-4 py-2.5 md:hidden">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base font-semibold text-content">{title}</h1>
        <div className="flex items-center gap-1.5">
          {actions.map((action) => <Button key={action.key} size="sm" variant={action.variant || 'secondary'} onClick={action.onClick}>{action.label}</Button>)}
          {menuActions.length ? <ActionMenu label="Plus" items={menuActions} /> : null}
        </div>
      </div>
    </div>
  )
}
