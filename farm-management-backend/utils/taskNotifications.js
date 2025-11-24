const { createNotification } = require('../routes/notifications');

async function checkUpcomingTasks(db, io) {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const tasksSnapshot = await db.collection('tasks')
      .where('status', 'in', ['pending', 'in_progress'])
      .get();
    
    for (const doc of tasksSnapshot.docs) {
      const task = { id: doc.id, ...doc.data() };
      const dueDate = task.dueDate.toDate();
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue === 2 && !task.reminderSent) {
        await createNotification(db, io, {
          userId: task.assignedTo,
          type: 'task_reminder',
          title: 'Upcoming Task',
          message: `Task "${task.type}" is due in 2 days (${dueDate.toLocaleDateString()})`,
          priority: 'high',
          data: { taskId: task.id, dueDate: dueDate.toISOString() }
        });
        
        await db.collection('tasks').doc(task.id).update({ reminderSent: true });
      }
      
      if (daysUntilDue < 0 && task.status !== 'completed') {
        await db.collection('tasks').doc(task.id).update({ status: 'overdue' });
        
        await createNotification(db, io, {
          userId: task.assignedTo,
          type: 'task_overdue',
          title: 'Overdue Task',
          message: `Task "${task.type}" is overdue by ${Math.abs(daysUntilDue)} days`,
          priority: 'critical',
          data: { taskId: task.id, dueDate: dueDate.toISOString() }
        });
      }
    }
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
}

async function checkUpcomingHarvests(db, io) {
  try {
    const now = new Date();
    
    const cropsSnapshot = await db.collection('crops')
      .where('status', 'in', ['planted', 'growing'])
      .get();
    
    for (const doc of cropsSnapshot.docs) {
      const crop = { id: doc.id, ...doc.data() };
      const harvestDate = new Date(crop.harvestDate);
      const timeDiff = harvestDate.getTime() - now.getTime();
      const daysUntilHarvest = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysUntilHarvest === 2 && !crop.harvestReminderSent) {
        await createNotification(db, io, {
          userId: 'all',
          type: 'harvest_reminder',
          title: 'Upcoming Harvest',
          message: `${crop.variety} in ${crop.farmName} is ready for harvest in 2 days (${harvestDate.toLocaleDateString()})`,
          priority: 'high',
          data: { cropId: crop.id, harvestDate: harvestDate.toISOString() }
        });
        
        await db.collection('crops').doc(crop.id).update({ harvestReminderSent: true });
      }
    }
  } catch (error) {
    console.error('Error checking harvests:', error);
  }
}

function startNotificationScheduler(db, io) {
  setInterval(() => {
    checkUpcomingTasks(db, io);
    checkUpcomingHarvests(db, io);
  }, 60 * 60 * 1000);
  
  checkUpcomingTasks(db, io);
  checkUpcomingHarvests(db, io);
}

module.exports = { startNotificationScheduler };
