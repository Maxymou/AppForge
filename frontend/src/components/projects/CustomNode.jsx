import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

function handleIdFromIndex(index) { return `item-${index}` }

function CustomNode({ data, selected }) {
  const items = data.items || []
  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-content-muted">Bloc fonctionnel</p>
        <div className="mb-2 flex items-start justify-between gap-2"><p className="break-words text-sm font-semibold leading-snug text-slate-100">{data.title || data.label || 'Sans titre'}</p><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-indigo-200' : 'bg-indigo-300'}`} /></div>
        {data.description ? <p className="line-clamp-3 text-xs leading-relaxed text-slate-300/90">{data.description}</p> : <p className="text-xs italic text-slate-500">Aucune description</p>}
        {items.length ? <div className="flow-node__items-divider mt-3 space-y-1 pt-2">{items.map((item, i) => <div key={`${item}-${i}`} className="relative pr-4"><Handle id={handleIdFromIndex(i)} type="source" position={Position.Right} style={{ top: 12 + i * 24, right: -4 }} /><p className="truncate text-xs text-slate-200/90"><span className="mr-1 text-indigo-300">•</span>{item}</p></div>)}</div> : null}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(CustomNode)
