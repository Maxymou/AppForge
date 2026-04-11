const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_prod', { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ id: user.id, username: user.username, email: user.email });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  const { username, email } = req.body;
  try {
    const updated = await prisma.user.update({ where: { id: req.user.userId }, data: { ...(username !== undefined && { username }), ...(email !== undefined && { email }) } });
    return res.json({ id: updated.id, username: updated.username, email: updated.email });
  } catch (err) {
    return res.status(400).json({ error: 'Mise à jour impossible' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel invalide' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashed } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
