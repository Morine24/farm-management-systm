const express = require('express');
const router = express.Router();

// Get all financial records
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { startDate, endDate, type } = req.query;
    let query = db.collection('financial');
    
    if (startDate && endDate) {
      query = query.where('date', '>=', new Date(startDate)).where('date', '<=', new Date(endDate));
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new financial record
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const recordData = { ...req.body, createdAt: new Date() };
    
    // If fieldId is provided, get field name
    if (recordData.fieldId) {
      const fieldDoc = await db.collection('fields').doc(recordData.fieldId).get();
      if (fieldDoc.exists) {
        recordData.fieldName = fieldDoc.data().name;
      }
    }
    
    const docRef = await db.collection('financial').add(recordData);
    res.status(201).json({ id: docRef.id, ...recordData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), 0, 1);
    const endDate = new Date(year || new Date().getFullYear(), 11, 31);
    
    const snapshot = await db.collection('financial')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
    
    const summary = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const month = data.date.toDate().getMonth() + 1;
      const key = `${data.type}-${month}`;
      
      if (!summary[key]) {
        summary[key] = { _id: { type: data.type, month }, total: 0 };
      }
      summary[key].total += data.amount;
    });
    
    res.json(Object.values(summary).sort((a, b) => a._id.month - b._id.month));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;