const express = require('express');
const router = express.Router();

// Get all notifications for a user
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { userId } = req.query;
    
    let query = db.collection('notifications').orderBy('createdAt', 'desc').limit(50);
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    const snapshot = await query.get();
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const notificationData = {
      ...req.body,
      createdAt: new Date(),
      read: false
    };
    
    const docRef = await db.collection('notifications').add(notificationData);
    const notification = { id: docRef.id, ...notificationData };
    
    // Emit real-time notification via Socket.IO
    req.app.get('io').emit('notification', notification);
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const db = req.app.get('db');
    await db.collection('notifications').doc(req.params.id).update({ read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { userId } = req.body;
    
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to create notification
async function createNotification(db, io, { userId, type, title, message, priority = 'medium', data = {} }) {
  const notification = {
    userId,
    type,
    title,
    message,
    priority,
    data,
    read: false,
    createdAt: new Date()
  };
  
  const docRef = await db.collection('notifications').add(notification);
  const savedNotification = { id: docRef.id, ...notification };
  
  // Emit real-time notification
  io.emit('notification', savedNotification);
  
  return savedNotification;
}

module.exports = router;
module.exports.createNotification = createNotification;
