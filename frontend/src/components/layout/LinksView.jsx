import React, { useEffect, useMemo, useState } from 'react'
import MobileHeader from './MobileHeader'
import { Button, Card, EmptyState, Input, Modal, Textarea, useToast } from '../ui/primitives'
import useLinkStore from '../../stores/linkStore'

export default function LinksView() {
  const { links, loading, error, fetchLinks, createLink, updateLink, deleteLink } = useLinkStore()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchLinks() }, [])

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

  const save = async () => {
    if (!title.trim() || !url.trim()) return
    setSaving(true)
    if (editing?.id) {
      const ok = await updateLink(editing.id, { title: title.trim(), url: url.trim(), note: note.trim() })
      if (ok) toast.success('Lien mis à jour')
    } else {
      const ok = await createLink({ title: title.trim(), url: url.trim(), note: note.trim() })
      if (ok) toast.success('Lien ajouté')
    }
    setSaving(false)
    setEditing(null)
  }

  const total = useMemo(() => links.length, [links])

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-secondary">
      <MobileHeader title="Liens" subtitle={`${total} ${total > 1 ? 'liens' : 'lien'}`} primaryAction={{ key: 'add', label: 'Ajouter', onClick: openCreate }} />
      <div className="hidden border-b border-border-subtle px-5 py-4 md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content">Liens utiles</h2>
            <p className="text-sm text-content-muted">{total} {total > 1 ? 'liens enregistrés' : 'lien enregistré'}</p>
          </div>
          <Button onClick={openCreate}>Ajouter un lien</Button>
        </div>
      </div>
      <div className="app-scroll px-4 py-4 md:px-7">
        {error ? <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</div> : null}
        {loading ? <div className="text-sm text-content-muted">Chargement des liens...</div> : !links.length ? (
          <EmptyState title="Aucun lien" description="Ajoutez vos ressources web pour les retrouver rapidement." action={<Button onClick={openCreate}>Ajouter un lien</Button>} />
        ) : (
          <div className="space-y-3">
            {links.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-content">{item.title}</p>
                    <a
                      className="mt-1 block break-all text-sm text-indigo-300 hover:text-indigo-200"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.url}
                    </a>
                    {item.note ? <p className="mt-1 text-xs text-content-muted">{item.note}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2 sm:ml-4">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Éditer</Button>
                    <Button size="sm" variant="danger" onClick={async () => {
                      const ok = await deleteLink(item.id)
                      if (ok) toast.success('Lien supprimé')
                    }}>Supprimer</Button>
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
          <Button onClick={save} className="w-full" disabled={saving || !title.trim() || !url.trim()}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </div>
      </Modal>
    </div>
  )
}
