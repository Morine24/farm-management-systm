const express = require('express');
const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const taskData = { ...req.body, createdAt: new Date() };
    const docRef = await db.collection('tasks').add(taskData);
    const savedTask = { id: docRef.id, ...taskData };
    
    // Emit real-time notification
    req.app.get('io').emit('new_task', savedTask);
    
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task status
router.put('/:id/status', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completedDate = new Date();
    }
    
    await db.collection('tasks').doc(req.params.id).update(updateData);
    const doc = await db.collection('tasks').doc(req.params.id).get();
    const task = { id: doc.id, ...doc.data() };
    
    // Emit real-time update
    req.app.get('io').emit('task_updated', task);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get overdue tasks
router.get('/overdue', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('tasks')
      .where('dueDate', '<', new Date())
      .where('status', '!=', 'completed')
      .get();
    const overdueTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(overdueTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;