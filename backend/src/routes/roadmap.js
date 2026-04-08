const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Build a tree from flat list
function buildTree(nodes) {
  const map = {};
  const roots = [];

  nodes.forEach(n => {
    map[n.id] = { ...n, children: [] };
  });

  nodes.forEach(n => {
    if (n.parentId && map[n.parentId]) {
      map[n.parentId].children.push(map[n.id]);
    } else if (!n.parentId) {
      roots.push(map[n.id]);
    }
  });

  // Sort children by order
  const sortChildren = (node) => {
    node.children.sort((a, b) => a.order - b.order);
    node.children.forEach(sortChildren);
    return node;
  };

  roots.sort((a, b) => a.order - b.order);
  roots.forEach(sortChildren);
  return roots;
}

// Parse markdown into node tree structure
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const nodes = [];
  let currentParent = null;
  let parentOrder = 0;
  let childOrder = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      const title = trimmed.slice(2).trim();
      currentParent = { title, parentId: null, order: parentOrder++, children: [] };
      nodes.push(currentParent);
      childOrder = 0;
    } else if (trimmed.startsWith('- ') && currentParent) {
      const title = trimmed.slice(2).trim();
      currentParent.children.push({ title, parentId: null, order: childOrder++ });
    }
  }

  return nodes;
}

// Export tree as markdown
function treeToMarkdown(nodes) {
  let md = '';
  for (const node of nodes) {
    md += `# ${node.title}\n`;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        md += `- ${child.title}\n`;
      }
    }
    md += '\n';
  }
  return md.trim();
}

// GET /api/roadmap
router.get('/', authMiddleware, async (req, res) => {
  try {
    const nodes = await prisma.roadmapNode.findMany({
      orderBy: { order: 'asc' }
    });
    const tree = buildTree(nodes);
    return res.json(tree);
  } catch (err) {
    console.error('Get roadmap error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roadmap/nodes
router.post('/nodes', authMiddleware, async (req, res) => {
  const { title, parentId, order } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    // Determine order if not provided
    let nodeOrder = order;
    if (nodeOrder === undefined) {
      const siblings = await prisma.roadmapNode.count({
        where: { parentId: parentId || null }
      });
      nodeOrder = siblings;
    }

    const node = await prisma.roadmapNode.create({
      data: {
        title,
        parentId: parentId || null,
        order: nodeOrder
      }
    });
    return res.status(201).json(node);
  } catch (err) {
    console.error('Create node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roadmap/nodes/:id
router.put('/nodes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, parentId, order, expanded } = req.body;

  try {
    const existing = await prisma.roadmapNode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const updated = await prisma.roadmapNode.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
        ...(expanded !== undefined && { expanded })
      }
    });
    return res.json(updated);
  } catch (err) {
    console.error('Update node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/roadmap/nodes/:id
router.delete('/nodes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.roadmapNode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Cascade delete handled by Prisma schema
    await prisma.roadmapNode.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roadmap/import
router.post('/import', authMiddleware, async (req, res) => {
  const { markdown } = req.body;

  if (!markdown) {
    return res.status(400).json({ error: 'Markdown content is required' });
  }

  try {
    // Delete all existing nodes
    await prisma.roadmapNode.deleteMany({});

    const sections = parseMarkdown(markdown);

    // Create parent nodes, then children
    for (const section of sections) {
      const parent = await prisma.roadmapNode.create({
        data: {
          title: section.title,
          parentId: null,
          order: section.order,
          expanded: true
        }
      });

      for (const child of section.children) {
        await prisma.roadmapNode.create({
          data: {
            title: child.title,
            parentId: parent.id,
            order: child.order,
            expanded: true
          }
        });
      }
    }

    const nodes = await prisma.roadmapNode.findMany({ orderBy: { order: 'asc' } });
    const tree = buildTree(nodes);
    return res.json(tree);
  } catch (err) {
    console.error('Import roadmap error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roadmap/export
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const nodes = await prisma.roadmapNode.findMany({ orderBy: { order: 'asc' } });
    const tree = buildTree(nodes);
    const markdown = treeToMarkdown(tree);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename="roadmap.md"');
    return res.send(markdown);
  } catch (err) {
    console.error('Export roadmap error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
