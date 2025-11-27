const express = require('express');
const router = express.Router();
const { createNotification } = require('./notifications');

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
    const io = req.app.get('io');
    const taskData = { 
      ...req.body, 
      createdAt: new Date(),
      labourCost: req.body.labourCost || 0,
      estimatedHours: req.body.estimatedHours || 0,
      actualHours: 0,
      actualCost: 0
    };
    const docRef = await db.collection('tasks').add(taskData);
    const savedTask = { id: docRef.id, ...taskData };
    
    // Create notification for assigned user
    await createNotification(db, io, {
      userId: 'all',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `Task "${taskData.type}" assigned to ${taskData.assignedTo}`,
      priority: 'medium',
      data: { taskId: docRef.id, farmName: taskData.farmName }
    });
    
    // Emit real-time notification
    io.emit('new_task', savedTask);
    
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task status
router.put('/:id/status', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status, actualHours, actualCost } = req.body;
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completedDate = new Date();
      if (actualHours) updateData.actualHours = actualHours;
      if (actualCost) updateData.actualCost = actualCost;
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
    const io = req.app.get('io');
    const snapshot = await db.collection('tasks')
      .where('dueDate', '<', new Date())
      .where('status', '!=', 'completed')
      .get();
    const overdueTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Send notifications for overdue tasks
    for (const task of overdueTasks) {
      await createNotification(db, io, {
        userId: 'all',
        type: 'task_overdue',
        title: 'Task Overdue',
        message: `Task "${task.type}" is overdue!`,
        priority: 'high',
        data: { taskId: task.id, farmName: task.farmName }
      });
    }
    
    res.json(overdueTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign labour to task
router.post('/:id/assign-labour', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { workerId, workerName, estimatedHours, hourlyRate } = req.body;
    const labourCost = estimatedHours * hourlyRate;
    
    await db.collection('tasks').doc(req.params.id).update({
      assignedWorker: workerId,
      assignedWorkerName: workerName,
      estimatedHours,
      hourlyRate,
      labourCost
    });
    
    const doc = await db.collection('tasks').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get task cost summary
router.get('/cost-summary', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const summary = {
      totalEstimatedCost: tasks.reduce((sum, t) => sum + (t.labourCost || 0), 0),
      totalActualCost: tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0),
      totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;