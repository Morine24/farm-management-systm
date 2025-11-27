const express = require('express');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const [farmsSnapshot, cropsSnapshot, tasksSnapshot, inventorySnapshot, financialSnapshot] = await Promise.all([
      db.collection('farms').get(),
      db.collection('crops').where('status', 'in', ['planted', 'growing']).get(),
      db.collection('tasks').where('status', '==', 'pending').get(),
      db.collection('inventory').get(),
      db.collection('financial').get()
    ]);

    const totalFields = farmsSnapshot.size;
    const activeCrops = cropsSnapshot.size;
    const pendingTasks = tasksSnapshot.size;
    
    let lowStockItems = 0;
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.quantity <= data.lowStockThreshold) {
        lowStockItems++;
      }
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    let monthlyRevenue = 0;
    let monthlyExpenses = 0;
    
    financialSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.toDate) {
        const recordDate = data.date.toDate();
        if (recordDate >= currentMonth) {
          if (data.type === 'income') {
            monthlyRevenue += data.amount;
          } else if (data.type === 'expense') {
            monthlyExpenses += data.amount;
          }
        }
      }
    });

    res.json({
      totalFields,
      activeCrops,
      pendingTasks,
      lowStockItems,
      monthlyRevenue,
      monthlyExpenses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;