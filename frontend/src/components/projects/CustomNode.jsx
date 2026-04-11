import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

function CustomNode({ data, selected }) {
  const items = data.items || []
  const visibleItems = items.slice(0, 3)
  const hiddenItems = Math.max(0, items.length - visibleItems.length)

  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-slate-100 break-words">
            {data.title || data.label || 'Untitled'}
          </p>
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              selected ? 'bg-indigo-200' : 'bg-indigo-300'
            }`}
          />
        </div>
        {data.description ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-slate-300/90">
            {data.description}
          </p>
        ) : (
          <p className="text-xs italic text-slate-500">No description</p>
        )}
        {visibleItems.length ? (
          <div className="flow-node__items-divider mt-3 space-y-1 pt-2">
            {visibleItems.map((item, i) => (
              <p key={i} className="truncate text-xs text-slate-200/90">
                <span className="mr-1 text-indigo-300">•</span>
                {item}
              </p>
            ))}
            {hiddenItems ? (
              <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-wide text-indigo-300/80">
                +{hiddenItems} more
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function areEqual(prevProps, nextProps) {
  if (prevProps.selected !== nextProps.selected) return false

  const prevData = prevProps.data
  const nextData = nextProps.data

  if (prevData === nextData) return true

  if (prevData?.title !== nextData?.title) return false
  if (prevData?.label !== nextData?.label) return false
  if (prevData?.description !== nextData?.description) return false
  if (prevData?.items?.length !== nextData?.items?.length) return false

  const prevItems = prevData?.items || []
  const nextItems = nextData?.items || []

  for (let i = 0; i < prevItems.length; i += 1) {
    if (prevItems[i] !== nextItems[i]) return false
  }

  return true
}

const MemoCustomNode = memo(CustomNode, areEqual)
MemoCustomNode.displayName = 'CustomNode'

export default MemoCustomNode
