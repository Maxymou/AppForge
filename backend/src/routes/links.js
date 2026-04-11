const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function normalizeUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json(links);
  } catch (error) {
    console.error('Get links error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, url, note } = req.body;
  const normalizedUrl = normalizeUrl(url);
  if (!title?.trim()) return res.status(400).json({ error: 'Le titre est requis' });
  if (!normalizedUrl) return res.status(400).json({ error: 'URL invalide' });

  try {
    const link = await prisma.link.create({
      data: {
        userId: req.user.userId,
        title: title.trim(),
        url: normalizedUrl,
        note: note?.trim() || null
      }
    });
    return res.status(201).json(link);
  } catch (error) {
    console.error('Create link error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, url, note } = req.body;

  const payload = {};
  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Le titre est requis' });
    payload.title = title.trim();
  }

  if (url !== undefined) {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return res.status(400).json({ error: 'URL invalide' });
    payload.url = normalizedUrl;
  }

  if (note !== undefined) payload.note = note?.trim() || null;

  try {
    const existing = await prisma.link.findFirst({ where: { id, userId: req.user.userId } });
    if (!existing) return res.status(404).json({ error: 'Lien introuvable' });

    const updated = await prisma.link.update({ where: { id }, data: payload });
    return res.json(updated);
  } catch (error) {
    console.error('Update link error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.link.findFirst({ where: { id, userId: req.user.userId } });
    if (!existing) return res.status(404).json({ error: 'Lien introuvable' });

    await prisma.link.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete link error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
