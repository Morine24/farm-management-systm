const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('workplans').orderBy('date', 'desc').get();
    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { date, activity, labourRequired } = req.body;
    const docRef = await db.collection('workplans').add({
      date,
      activity,
      labourRequired,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { date, activity, labourRequired } = req.body;
    await db.collection('workplans').doc(req.params.id).update({
      date,
      activity,
      labourRequired,
      updatedAt: new Date().toISOString()
    });
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('workplans').doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
