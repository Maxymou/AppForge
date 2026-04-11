const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Parse project markdown format
function parseProjectMarkdown(markdown) {
  const result = {
    name: '',
    description: '',
    flow: '',
    nodes: [],
    context: '',
    instructions: ''
  };

  const lines = markdown.split('\n');
  let section = null;
  let currentNode = null;
  let buffer = [];

  const flushBuffer = () => {
    if (!buffer.length) return;
    const text = buffer.join('\n').trim();
    buffer = [];
    return text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Project name
    if (trimmed.startsWith('# PROJECT:')) {
      result.name = trimmed.replace('# PROJECT:', '').trim();
      continue;
    }

    // Section headers
    if (trimmed === '## FLOW') {
      if (currentNode) {
        result.nodes.push(currentNode);
        currentNode = null;
      }
      section = 'flow';
      buffer = [];
      continue;
    }
    if (trimmed === '## NODES') {
      if (currentNode) {
        result.nodes.push(currentNode);
        currentNode = null;
      }
      const text = flushBuffer();
      if (section === 'flow' && text) result.flow = text;
      section = 'nodes';
      continue;
    }
    if (trimmed === '## CONTEXT') {
      if (currentNode) {
        result.nodes.push(currentNode);
        currentNode = null;
      }
      section = 'context';
      buffer = [];
      continue;
    }
    if (trimmed === '## INSTRUCTIONS IA') {
      const text = flushBuffer();
      if (section === 'context' && text) result.context = text;
      section = 'instructions';
      buffer = [];
      continue;
    }
    if (trimmed === '---') {
      if (section === 'flow') {
        const text = flushBuffer();
        if (text) result.flow = text;
      } else if (section === 'context') {
        const text = flushBuffer();
        if (text) result.context = text;
      } else if (section === 'instructions') {
        const text = flushBuffer();
        if (text) result.instructions = text;
      }
      continue;
    }

    // Node headers
    if (trimmed.startsWith('### ') && section === 'nodes') {
      if (currentNode) {
        result.nodes.push(currentNode);
      }
      currentNode = {
        title: trimmed.slice(4).trim(),
        description: '',
        notes: '',
        items: []
      };
      continue;
    }

    // Items under nodes
    if (trimmed.startsWith('- ') && section === 'nodes' && currentNode) {
      currentNode.items.push(trimmed.slice(2).trim());
      continue;
    }

    // Buffer for current section
    if (section === 'flow' || section === 'context' || section === 'instructions') {
      buffer.push(line);
    }
  }

  // Flush remaining
  if (currentNode) {
    result.nodes.push(currentNode);
  }
  const remainingText = flushBuffer();
  if (section === 'instructions' && remainingText) {
    result.instructions = remainingText;
  }

  return result;
}

// Export project to markdown
function projectToMarkdown(project, nodes, edges) {
  let md = `# PROJECT: ${project.name}\n\n`;

  // FLOW section - build from edges
  md += `## FLOW\n`;
  if (edges && edges.length > 0) {
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.nodeId] = n.title; });
    const flowStr = edges.map(e => `${nodeMap[e.source] || e.source} → ${nodeMap[e.target] || e.target}`).join('\n');
    md += flowStr + '\n';
  }
  md += '\n---\n\n';

  // NODES section
  md += `## NODES\n\n`;
  for (const node of nodes) {
    md += `### ${node.title}\n`;
    if (node.items && node.items.length > 0) {
      for (const item of node.items) {
        md += `- ${item}\n`;
      }
    }
    if (node.description) {
      md += `\n${node.description}\n`;
    }
    md += '\n';
  }
  md += '---\n\n';

  // CONTEXT section
  md += `## CONTEXT\n\n`;
  if (project.description) {
    md += `${project.description}\n`;
  }
  md += '\n---\n\n';

  // INSTRUCTIONS IA section
  md += `## INSTRUCTIONS IA\n\n`;
  md += `Tu dois :\n`;
  md += `- modifier ce fichier\n`;
  md += `- ajouter / modifier / supprimer des éléments\n`;
  md += `- garder EXACTEMENT la structure\n\n`;
  md += `IMPORTANT :\n`;
  md += `Retourne EXACTEMENT ce fichier modifié.\n`;

  return md;
}

// GET /api/projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { nodes: true, edges: true } }
      }
    });
    return res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, status, comment } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const project = await prisma.project.create({
      data: { name, description: description || null, status: status || "idee", comment: comment || null }
    });
    return res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, readOnly, status, comment } = req.body;
  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(readOnly !== undefined && { readOnly }),
        ...(status !== undefined && { status }),
        ...(comment !== undefined && { comment })
      }
    });
    return res.json(updated);
  } catch (err) {
    console.error('Update project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await prisma.project.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/nodes
router.post('/:id/nodes', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nodeId, title, description, notes, items, posX, posY } = req.body;
  if (!nodeId || !title) {
    return res.status(400).json({ error: 'nodeId and title are required' });
  }
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const node = await prisma.projectNode.create({
      data: {
        projectId: id,
        nodeId,
        title,
        description: description || null,
        notes: notes || null,
        items: items || [],
        posX: posX || 0,
        posY: posY || 0
      }
    });
    return res.status(201).json(node);
  } catch (err) {
    console.error('Create node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id/nodes/:nodeId
router.put('/:id/nodes/:nodeId', authMiddleware, async (req, res) => {
  const { id, nodeId } = req.params;
  const { title, description, notes, items, posX, posY } = req.body;
  try {
    const node = await prisma.projectNode.findFirst({
      where: { projectId: id, nodeId }
    });
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    const updated = await prisma.projectNode.update({
      where: { id: node.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(items !== undefined && { items }),
        ...(posX !== undefined && { posX }),
        ...(posY !== undefined && { posY })
      }
    });
    return res.json(updated);
  } catch (err) {
    console.error('Update node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id/nodes/:nodeId
router.delete('/:id/nodes/:nodeId', authMiddleware, async (req, res) => {
  const { id, nodeId } = req.params;
  try {
    const node = await prisma.projectNode.findFirst({
      where: { projectId: id, nodeId }
    });
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    await prisma.projectNode.delete({ where: { id: node.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete node error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/edges
router.post('/:id/edges', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { edgeId, source, target, sourceHandle } = req.body;
  if (!edgeId || !source || !target) {
    return res.status(400).json({ error: 'edgeId, source and target are required' });
  }
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const edge = await prisma.projectEdge.create({
      data: { projectId: id, edgeId, source, target, sourceHandle: sourceHandle || null }
    });
    return res.status(201).json(edge);
  } catch (err) {
    console.error('Create edge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id/edges/:edgeId
router.delete('/:id/edges/:edgeId', authMiddleware, async (req, res) => {
  const { id, edgeId } = req.params;
  try {
    const edge = await prisma.projectEdge.findFirst({
      where: { projectId: id, edgeId }
    });
    if (!edge) {
      return res.status(404).json({ error: 'Edge not found' });
    }
    await prisma.projectEdge.delete({ where: { id: edge.id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete edge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/save - save full state and create version
router.post('/:id/save', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nodes, edges } = req.body;

  if (!nodes || !edges) {
    return res.status(400).json({ error: 'nodes and edges are required' });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Save snapshot as version
    const snapshot = { nodes, edges, savedAt: new Date().toISOString() };
    await prisma.projectVersion.create({
      data: { projectId: id, snapshot }
    });

    // Delete old nodes and edges, then recreate
    await prisma.projectEdge.deleteMany({ where: { projectId: id } });
    await prisma.projectNode.deleteMany({ where: { projectId: id } });

    // Recreate nodes
    for (const node of nodes) {
      await prisma.projectNode.create({
        data: {
          projectId: id,
          nodeId: node.id,
          title: node.data?.title || node.data?.label || 'Untitled',
          description: node.data?.description || null,
          notes: node.data?.notes || null,
          items: node.data?.items || [],
          posX: node.position?.x || 0,
          posY: node.position?.y || 0
        }
      });
    }

    // Recreate edges
    for (const edge of edges) {
      await prisma.projectEdge.create({
        data: {
          projectId: id,
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null
        }
      });
    }

    // Update project updatedAt
    await prisma.project.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Keep only last 50 versions
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      skip: 50
    });
    if (versions.length > 0) {
      await prisma.projectVersion.deleteMany({
        where: { id: { in: versions.map(v => v.id) } }
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Save project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/versions
router.get('/:id/versions', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const versions = await prisma.projectVersion.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, projectId: true, createdAt: true }
    });
    return res.json(versions);
  } catch (err) {
    console.error('Get versions error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/versions/:versionId/rollback
router.post('/:id/versions/:versionId/rollback', authMiddleware, async (req, res) => {
  const { id, versionId } = req.params;
  try {
    const version = await prisma.projectVersion.findFirst({
      where: { id: versionId, projectId: id }
    });
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const snapshot = version.snapshot;
    const nodes = snapshot.nodes || [];
    const edges = snapshot.edges || [];

    // Clear and restore
    await prisma.projectEdge.deleteMany({ where: { projectId: id } });
    await prisma.projectNode.deleteMany({ where: { projectId: id } });

    for (const node of nodes) {
      await prisma.projectNode.create({
        data: {
          projectId: id,
          nodeId: node.id,
          title: node.data?.title || node.data?.label || 'Untitled',
          description: node.data?.description || null,
          notes: node.data?.notes || null,
          items: node.data?.items || [],
          posX: node.position?.x || 0,
          posY: node.position?.y || 0
        }
      });
    }

    for (const edge of edges) {
      await prisma.projectEdge.create({
        data: {
          projectId: id,
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null
        }
      });
    }

    await prisma.project.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: { orderBy: { createdAt: 'asc' } }
      }
    });

    return res.json(project);
  } catch (err) {
    console.error('Rollback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/duplicate
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true
      }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newProject = await prisma.project.create({
      data: {
        name: `${project.name} (copy)`,
        description: project.description,
        readOnly: false
      }
    });

    for (const node of project.nodes) {
      await prisma.projectNode.create({
        data: {
          projectId: newProject.id,
          nodeId: node.nodeId,
          title: node.title,
          description: node.description,
          notes: node.notes,
          items: node.items,
          posX: node.posX,
          posY: node.posY
        }
      });
    }

    for (const edge of project.edges) {
      await prisma.projectEdge.create({
        data: {
          projectId: newProject.id,
          edgeId: edge.edgeId,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null
        }
      });
    }

    const result = await prisma.project.findUnique({
      where: { id: newProject.id },
      include: {
        nodes: true,
        edges: true
      }
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Duplicate project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/import
router.post('/:id/import', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { markdown } = req.body;

  if (!markdown) {
    return res.status(400).json({ error: 'Markdown content is required' });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const parsed = parseProjectMarkdown(markdown);

    // Update project metadata
    await prisma.project.update({
      where: { id },
      data: {
        name: parsed.name || project.name,
        description: parsed.context || project.description
      }
    });

    // Clear existing nodes and edges
    await prisma.projectEdge.deleteMany({ where: { projectId: id } });
    await prisma.projectNode.deleteMany({ where: { projectId: id } });

    // Create nodes from parsed data
    const nodeIdMap = {};
    let xOffset = 100;
    for (const nodeData of parsed.nodes) {
      const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      nodeIdMap[nodeData.title] = nodeId;
      await prisma.projectNode.create({
        data: {
          projectId: id,
          nodeId,
          title: nodeData.title,
          description: nodeData.description || null,
          notes: nodeData.notes || null,
          items: nodeData.items || [],
          posX: xOffset,
          posY: 200
        }
      });
      xOffset += 200;
    }

    // Create edges from flow
    if (parsed.flow) {
      const flowLines = parsed.flow.split('\n');
      for (const line of flowLines) {
        const parts = line.split('→').map(p => p.trim());
        for (let i = 0; i < parts.length - 1; i++) {
          const sourceTitle = parts[i];
          const targetTitle = parts[i + 1];
          const sourceId = nodeIdMap[sourceTitle];
          const targetId = nodeIdMap[targetTitle];
          if (sourceId && targetId) {
            await prisma.projectEdge.create({
              data: {
                projectId: id,
                edgeId: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                source: sourceId,
                target: targetId
              }
            });
          }
        }
      }
    }

    const result = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: { orderBy: { createdAt: 'asc' } }
      }
    });

    return res.json(result);
  } catch (err) {
    console.error('Import project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/export
router.get('/:id/export', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const markdown = projectToMarkdown(project, project.nodes, project.edges);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}.md"`);
    return res.send(markdown);
  } catch (err) {
    console.error('Export project error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
