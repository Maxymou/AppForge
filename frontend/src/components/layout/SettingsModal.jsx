import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { Button, Input, Modal, useToast } from '../ui/primitives'

export default function SettingsModal({ open, onClose }) {
  const { user, updateProfile, changePassword, logout } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!open) return
    setUsername(user?.username || '')
    setEmail(user?.email || '')
    setCurrentPassword('')
    setNewPassword('')
  }, [open, user])

  const saveProfile = async () => {
    const updated = await updateProfile({ username: username.trim(), email: email.trim() })
    if (updated) toast.success('Profil mis à jour')
    else toast.error('Impossible de mettre à jour le profil')
  }

  const savePassword = async () => {
    const ok = await changePassword(currentPassword, newPassword)
    if (ok) { toast.success('Mot de passe modifié'); setCurrentPassword(''); setNewPassword('') }
    else toast.error('Échec de la mise à jour du mot de passe')
  }

  const handleLogout = () => { logout(); onClose?.(); navigate('/login') }

  return (
    <Modal open={open} onClose={onClose} title="Paramètres" description="Gérez votre compte utilisateur.">
      <div className="space-y-4">
        <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Nom d'utilisateur</label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Votre nom" /></div>
        <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" /></div>
        <Button onClick={saveProfile} className="w-full">Enregistrer le profil</Button>

        <div className="border-t border-border-subtle pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-content-muted">Mot de passe</p>
          <div className="space-y-2"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mot de passe actuel" /><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" /><Button variant="secondary" onClick={savePassword} disabled={!currentPassword || !newPassword} className="w-full">Modifier le mot de passe</Button></div>
        </div>

        <div className="border-t border-border-subtle pt-4"><Button variant="danger" onClick={handleLogout} className="w-full">Se déconnecter</Button></div>
      </div>
    </Modal>
  )
}
