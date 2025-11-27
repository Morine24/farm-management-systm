const express = require('express');
const router = express.Router();

// Get all drip lines for a bed
router.get('/bed/:bedId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('driplines').where('bedId', '==', req.params.bedId).get();
    const driplines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(driplines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create drip line
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const driplineData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('driplines').add(driplineData);
    res.status(201).json({ id: docRef.id, ...driplineData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update drip line
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('driplines').doc(req.params.id).update(req.body);
    const doc = await db.collection('driplines').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete drip line
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('driplines').doc(req.params.id).delete();
    res.json({ message: 'Drip line deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
