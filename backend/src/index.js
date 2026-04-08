const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const roadmapRoutes = require('./routes/roadmap');
const projectRoutes = require('./routes/projects');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@appforge.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: { email, password: hash } });
      console.log('Admin user created:', email);
    } else {
      console.log('Admin user already exists:', email);
    }
  } catch (err) {
    console.error('Seed admin error:', err);
  }
}

async function main() {
  await seedAdmin();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AppForge backend running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
