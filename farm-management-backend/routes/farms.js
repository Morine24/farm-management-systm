const express = require('express');
const router = express.Router();

// Get all farms
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('farms').get();
    const farms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new farm
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received farm data:', req.body);
    const db = req.app.get('db');
    if (!db) {
      console.error('❌ Database not connected');
      return res.status(500).json({ message: 'Database not connected' });
    }
    const farmData = { 
      ...req.body, 
      createdAt: new Date(),
      coordinates: req.body.coordinates || [],
      soilHealth: req.body.soilHealth || { ph: 0, moisture: 0, temperature: 0 }
    };
    console.log('💾 Saving to Firestore:', farmData);
    const docRef = await db.collection('farms').add(farmData);
    console.log('✅ Farm saved with ID:', docRef.id);
    res.status(201).json({ id: docRef.id, ...farmData });
  } catch (error) {
    console.error('❌ Error creating farm:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update farm
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('farms').doc(req.params.id).update(req.body);
    const doc = await db.collection('farms').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update soil health
router.put('/:id/soil-health', async (req, res) => {
  try {
    const db = req.app.get('db');
    const soilHealthData = { ...req.body, lastUpdated: new Date() };
    await db.collection('farms').doc(req.params.id).update({ soilHealth: soilHealthData });
    const doc = await db.collection('farms').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;