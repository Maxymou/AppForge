import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

function handleIdFromIndex(index) { return `item-${index}` }

function CustomNode({ data, selected }) {
  const items = data.items || []
  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-content-muted">Bloc fonctionnel</p>
        <div className="mb-2 flex items-start justify-between gap-2"><p className="break-words text-[13px] font-semibold leading-snug text-slate-100 sm:text-sm">{data.title || data.label || 'Sans titre'}</p><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-indigo-200' : 'bg-indigo-300'}`} /></div>
        {data.description ? <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-300/90 sm:text-xs">{data.description}</p> : <p className="text-[11px] italic text-slate-500 sm:text-xs">Aucune description</p>}
        {items.length ? <div className="flow-node__items-divider mt-2.5 space-y-1.5 pt-2">{items.map((item, i) => <div key={`${item}-${i}`} className="group/item relative flex min-h-6 items-center pr-4"><Handle id={handleIdFromIndex(i)} type="source" position={Position.Right} style={{ right: -5, top: '50%', transform: 'translateY(-50%)' }} /><p className="truncate text-[11px] text-slate-200/90 sm:text-xs"><span className="mr-1 text-indigo-300">•</span>{item}</p></div>)}</div> : null}
      </div>
      {!items.length ? <Handle type="source" position={Position.Bottom} /> : null}
    </div>
  )
}

export default memo(CustomNode)
