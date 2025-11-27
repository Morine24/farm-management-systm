const express = require('express');
const router = express.Router();

// Get sections (with optional farmId query parameter)
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { farmId } = req.query;
    
    if (farmId) {
      const snapshot = await db.collection('sections').where('farmId', '==', farmId).get();
      const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(sections);
    }
    
    // Return all sections if no farmId specified
    const snapshot = await db.collection('sections').get();
    const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all sections for a farm (legacy endpoint)
router.get('/farm/:farmId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('sections').where('farmId', '==', req.params.farmId).get();
    const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create section
router.post('/', async (req, res) => {
  try {
    const { name, area, farmId } = req.body;
    
    // Validate required fields
    if (!name || !area || !farmId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: { name, area, farmId },
        received: req.body
      });
    }

    const db = req.app.get('db');
    const sectionData = {
      name,
      area: Number(area),
      farmId,
      createdAt: new Date()
    };

    console.log('Creating section:', sectionData);
    
    const docRef = await db.collection('sections').add(sectionData);
    const response = { id: docRef.id, ...sectionData };
    console.log('Section created:', response);
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ 
      message: 'Error creating section',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update section
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('sections').doc(req.params.id).update(req.body);
    const doc = await db.collection('sections').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete section
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('sections').doc(req.params.id).delete();
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
