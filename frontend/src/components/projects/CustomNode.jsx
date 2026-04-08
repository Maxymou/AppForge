import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

const CustomNode = memo(({ data, selected }) => {
  return (
    <div
      className={`
        bg-white border-2 rounded-xl shadow-lg min-w-[120px] max-w-[220px] transition-all
        ${selected
          ? 'border-blue-400 shadow-blue-500/30 shadow-xl'
          : 'border-blue-600 hover:border-blue-400 hover:shadow-xl'
        }
      `}
      style={{ background: '#1e293b', borderColor: selected ? '#60a5fa' : '#3b82f6' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ background: '#3b82f6', border: '2px solid #1e293b' }}
      />

      <div className="px-4 py-3">
        <p
          className="text-white text-sm font-semibold text-center leading-tight"
          style={{ wordBreak: 'break-word' }}
        >
          {data.title || data.label || 'Untitled'}
        </p>
        {data.description && (
          <p className="text-slate-400 text-xs text-center mt-1 leading-tight line-clamp-2">
            {data.description}
          </p>
        )}
        {data.items && data.items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-600">
            {data.items.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
            {data.items.length > 3 && (
              <p className="text-slate-500 text-xs mt-1 text-center">+{data.items.length - 3} more</p>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ background: '#3b82f6', border: '2px solid #1e293b' }}
      />
    </div>
  )
})

CustomNode.displayName = 'CustomNode'

export default CustomNode
