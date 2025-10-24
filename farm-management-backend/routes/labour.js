const express = require('express');
const router = express.Router();

// Get all workers
router.get('/workers', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('workers').get();
    const workers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new worker
router.post('/workers', async (req, res) => {
  try {
    const db = req.app.get('db');
    if (!db) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const workerData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('workers').add(workerData);
    res.status(201).json({ id: docRef.id, ...workerData });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check-in worker
router.post('/checkin', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { workerId, workerName, workerType, fieldId, fieldName } = req.body;
    const checkinData = {
      workerId,
      workerName,
      workerType,
      fieldId,
      fieldName,
      checkInTime: new Date(),
      checkOutTime: null,
      status: 'checked_in'
    };
    const docRef = await db.collection('attendance').add(checkinData);
    res.status(201).json({ id: docRef.id, ...checkinData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check-out worker
router.put('/checkout/:attendanceId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const attendanceDoc = await db.collection('attendance').doc(req.params.attendanceId).get();
    const attendanceData = attendanceDoc.data();
    
    const checkOutTime = new Date();
    const checkInTime = attendanceData.checkInTime.toDate();
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    await db.collection('attendance').doc(req.params.attendanceId).update({
      checkOutTime,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      status: 'checked_out'
    });
    
    res.json({ message: 'Checked out successfully', hoursWorked: parseFloat(hoursWorked.toFixed(2)) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get active check-ins
router.get('/active-checkins', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('attendance').where('status', '==', 'checked_in').get();
    const checkins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all labour records
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('labour').get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new labour record
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
    
    const docRef = await db.collection('labour').add(recordData);
    res.status(201).json({ id: docRef.id, ...recordData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update labour record
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('labour').doc(req.params.id).update(req.body);
    const doc = await db.collection('labour').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete labour record
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('labour').doc(req.params.id).delete();
    res.json({ message: 'Labour record deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
