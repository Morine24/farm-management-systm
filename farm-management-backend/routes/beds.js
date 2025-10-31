const express = require('express');
const router = express.Router();

// Get all beds for a block
router.get('/block/:blockId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('beds').where('blockId', '==', req.params.blockId).get();
    const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create bed
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const bedData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('beds').add(bedData);
    res.status(201).json({ id: docRef.id, ...bedData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bed
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('beds').doc(req.params.id).update(req.body);
    const doc = await db.collection('beds').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bed
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('beds').doc(req.params.id).delete();
    res.json({ message: 'Bed deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
