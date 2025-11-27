const express = require('express');
const router = express.Router();

// Get all crops
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('crops').get();
    const crops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new crop
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const cropData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('crops').add(cropData);
    res.status(201).json({ id: docRef.id, ...cropData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update crop
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('crops').doc(req.params.id).update(req.body);
    const doc = await db.collection('crops').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get crop yield history
router.get('/yield-history', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('crops').where('yieldActual', '>', 0).get();
    const yieldHistory = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const year = data.actualHarvestDate ? new Date(data.actualHarvestDate.toDate()).getFullYear() : new Date().getFullYear();
      const key = `${data.variety}-${year}`;
      
      if (!yieldHistory[key]) {
        yieldHistory[key] = { variety: data.variety, year, totalYield: 0, count: 0 };
      }
      yieldHistory[key].totalYield += data.yieldActual;
      yieldHistory[key].count += 1;
    });
    
    const result = Object.values(yieldHistory).map(item => ({
      _id: { variety: item.variety, year: item.year },
      totalYield: item.totalYield,
      avgYield: item.totalYield / item.count
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;