const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const roadmapRoutes = require('./routes/roadmap');
const projectRoutes = require('./routes/projects');
const linksRoutes = require('./routes/links');
const { seedAdmin } = require('./utils/seedAdmin');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/links', linksRoutes);

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

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[startup] database connected');

    await seedAdmin(prisma);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AppForge backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[startup] backend initialization failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
