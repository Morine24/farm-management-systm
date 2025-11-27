const express = require('express');
const router = express.Router();

// Get all contracts
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('contracts').orderBy('date', 'desc').get();
    const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contract by ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const doc = await db.collection('contracts').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Contract not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contract
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { date, project, inCharge, contact, employees } = req.body;
    const docRef = await db.collection('contracts').add({
      date,
      project,
      inCharge,
      contact,
      employees,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: docRef.id, message: 'Contract created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contract
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { date, project, inCharge, contact, employees } = req.body;
    await db.collection('contracts').doc(req.params.id).update({
      date,
      project,
      inCharge,
      contact,
      employees,
      updatedAt: new Date().toISOString()
    });
    res.json({ message: 'Contract updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contract
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('contracts').doc(req.params.id).delete();
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
