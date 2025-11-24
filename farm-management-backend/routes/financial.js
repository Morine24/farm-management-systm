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
    
    // Remove undefined fields
    Object.keys(recordData).forEach(key => {
      if (recordData[key] === undefined) {
        delete recordData[key];
      }
    });
    
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

// Generate financial report
router.get('/report', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const snapshot = await db.collection('financial')
      .where('date', '>=', start)
      .where('date', '<=', end)
      .get();
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const income = records.filter(r => r.type === 'income');
    const expenses = records.filter(r => r.type === 'expense');
    
    const totalIncome = income.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);
    
    const incomeByCategory = {};
    income.forEach(r => {
      incomeByCategory[r.category] = (incomeByCategory[r.category] || 0) + r.amount;
    });
    
    const expensesByCategory = {};
    expenses.forEach(r => {
      expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + r.amount;
    });
    
    res.json({
      period: { startDate: start, endDate: end },
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0,
      incomeByCategory,
      expensesByCategory,
      transactionCount: { income: income.length, expenses: expenses.length }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate forecast
router.get('/forecast', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { months = 3 } = req.query;
    
    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const snapshot = await db.collection('financial')
      .where('date', '>=', sixMonthsAgo)
      .get();
    
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate monthly averages
    const monthlyData = {};
    records.forEach(r => {
      const date = r.date.toDate();
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      if (r.type === 'income') {
        monthlyData[monthKey].income += r.amount;
      } else {
        monthlyData[monthKey].expenses += r.amount;
      }
    });
    
    const monthlyValues = Object.values(monthlyData);
    const avgIncome = monthlyValues.reduce((sum, m) => sum + m.income, 0) / monthlyValues.length;
    const avgExpenses = monthlyValues.reduce((sum, m) => sum + m.expenses, 0) / monthlyValues.length;
    
    // Calculate growth rate
    const recentMonths = monthlyValues.slice(-3);
    const olderMonths = monthlyValues.slice(0, 3);
    const recentAvgIncome = recentMonths.reduce((sum, m) => sum + m.income, 0) / recentMonths.length;
    const olderAvgIncome = olderMonths.reduce((sum, m) => sum + m.income, 0) / olderMonths.length;
    const growthRate = olderAvgIncome > 0 ? (recentAvgIncome - olderAvgIncome) / olderAvgIncome : 0;
    
    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= parseInt(months); i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const projectedIncome = avgIncome * (1 + growthRate * i);
      const projectedExpenses = avgExpenses * 1.02; // Assume 2% expense growth
      
      forecast.push({
        month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        projectedIncome: Math.round(projectedIncome),
        projectedExpenses: Math.round(projectedExpenses),
        projectedProfit: Math.round(projectedIncome - projectedExpenses)
      });
    }
    
    res.json({
      historicalAverage: { income: Math.round(avgIncome), expenses: Math.round(avgExpenses) },
      growthRate: (growthRate * 100).toFixed(2) + '%',
      forecast
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get category breakdown
router.get('/categories', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { type, startDate, endDate } = req.query;
    
    let query = db.collection('financial');
    if (type) query = query.where('type', '==', type);
    if (startDate) query = query.where('date', '>=', new Date(startDate));
    if (endDate) query = query.where('date', '<=', new Date(endDate));
    
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => doc.data());
    
    const categoryTotals = {};
    records.forEach(r => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    });
    
    const result = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: records.length > 0 ? ((amount / records.reduce((sum, r) => sum + r.amount, 0)) * 100).toFixed(2) : 0
    })).sort((a, b) => b.amount - a.amount);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;