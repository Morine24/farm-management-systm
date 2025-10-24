const express = require('express');
const router = express.Router();

// Get all fields
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('fields').get();
    const fields = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new field
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received field data:', req.body);
    const db = req.app.get('db');
    if (!db) {
      console.error('❌ Database not connected');
      return res.status(500).json({ message: 'Database not connected' });
    }
    const fieldData = { 
      ...req.body, 
      createdAt: new Date(),
      coordinates: req.body.coordinates || [],
      soilHealth: req.body.soilHealth || { ph: 0, moisture: 0, temperature: 0 }
    };
    console.log('💾 Saving to Firestore:', fieldData);
    const docRef = await db.collection('fields').add(fieldData);
    console.log('✅ Field saved with ID:', docRef.id);
    res.status(201).json({ id: docRef.id, ...fieldData });
  } catch (error) {
    console.error('❌ Error creating field:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update field
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('fields').doc(req.params.id).update(req.body);
    const doc = await db.collection('fields').doc(req.params.id).get();
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
    await db.collection('fields').doc(req.params.id).update({ soilHealth: soilHealthData });
    const doc = await db.collection('fields').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;