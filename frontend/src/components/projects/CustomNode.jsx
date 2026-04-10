import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

const CustomNode = memo(({ data, selected }) => {
  return (
    <div className={`min-w-[180px] max-w-[260px] rounded-2xl border bg-[#131c2b] shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-all ${selected ? 'border-indigo-300/80 shadow-[0_0_0_2px_rgba(124,143,248,0.25)]' : 'border-[#2a3954] hover:border-indigo-300/50'}`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3" style={{ background: '#7c8ff8', border: '2px solid #131c2b' }} />
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">{data.title || data.label || 'Untitled'}</p>
          <span className="h-2 w-2 rounded-full bg-indigo-300" />
        </div>
        {data.description ? <p className="line-clamp-2 text-xs text-slate-400">{data.description}</p> : <p className="text-xs text-slate-500">No description</p>}
        {data.items?.length ? (
          <div className="mt-3 border-t border-[#2a3954] pt-2">
            {data.items.slice(0, 3).map((item, i) => <p key={i} className="truncate text-xs text-slate-300">• {item}</p>)}
            {data.items.length > 3 ? <p className="mt-1 text-xs text-slate-500">+{data.items.length - 3} more</p> : null}
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3" style={{ background: '#7c8ff8', border: '2px solid #131c2b' }} />
    </div>
  )
})

CustomNode.displayName = 'CustomNode'

export default CustomNode
