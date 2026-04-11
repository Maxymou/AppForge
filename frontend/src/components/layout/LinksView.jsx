import React, { useMemo, useState } from 'react'
import MobileHeader from './MobileHeader'
import { Button, Card, EmptyState, Input, Modal, Textarea } from '../ui/primitives'

const KEY = 'appforge_links'

const loadLinks = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export default function LinksView() {
  const [links, setLinks] = useState(loadLinks)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const persist = (next) => {
    setLinks(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const openCreate = () => {
    setEditing({ id: null })
    setTitle('')
    setUrl('https://')
    setNote('')
  }

  const openEdit = (item) => {
    setEditing(item)
    setTitle(item.title)
    setUrl(item.url)
    setNote(item.note || '')
  }

  const save = () => {
    if (!title.trim() || !url.trim()) return
    if (editing?.id) {
      persist(links.map((l) => (l.id === editing.id ? { ...l, title: title.trim(), url: url.trim(), note: note.trim() } : l)))
    } else {
      persist([{ id: `link-${Date.now()}`, title: title.trim(), url: url.trim(), note: note.trim() }, ...links])
    }
    setEditing(null)
  }

  const total = useMemo(() => links.length, [links])

  return (
    <div className="flex h-full flex-col bg-secondary">
      <MobileHeader title="Liens" actions={[{ key: 'add', label: 'Ajouter', onClick: openCreate }]} />
      <div className="hidden border-b border-border-subtle px-5 py-4 md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content">Liens utiles</h2>
            <p className="text-sm text-content-muted">{total} {total > 1 ? 'liens enregistrés' : 'lien enregistré'}</p>
          </div>
          <Button onClick={openCreate}>Ajouter un lien</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-7">
        {!links.length ? (
          <EmptyState title="Aucun lien" description="Ajoutez vos ressources web pour les retrouver rapidement." action={<Button onClick={openCreate}>Ajouter un lien</Button>} />
        ) : (
          <div className="space-y-3">
            {links.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-content">{item.title}</p>
                    <a className="text-xs text-indigo-300" href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                    {item.note ? <p className="mt-1 text-xs text-content-muted">{item.note}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Éditer</Button>
                    <Button size="sm" variant="danger" onClick={() => persist(links.filter((l) => l.id !== item.id))}>Supprimer</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier le lien' : 'Ajouter un lien'}>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Note courte (optionnel)" />
          <Button onClick={save} className="w-full">Enregistrer</Button>
        </div>
      </Modal>
    </div>
  )
}
