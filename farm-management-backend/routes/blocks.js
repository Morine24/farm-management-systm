const express = require('express');
const router = express.Router();

// Get all blocks for a section
router.get('/section/:sectionId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('blocks').where('sectionId', '==', req.params.sectionId).get();
    const blocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create block
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const blockData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('blocks').add(blockData);
    res.status(201).json({ id: docRef.id, ...blockData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update block
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('blocks').doc(req.params.id).update(req.body);
    const doc = await db.collection('blocks').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete block
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('blocks').doc(req.params.id).delete();
    res.json({ message: 'Block deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
