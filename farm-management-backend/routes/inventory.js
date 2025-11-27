const express = require('express');
const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('inventory').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const itemData = { ...req.body, lastUpdated: new Date() };
    
    // If fieldId is provided, get field name
    if (itemData.fieldId) {
      const fieldDoc = await db.collection('fields').doc(itemData.fieldId).get();
      if (fieldDoc.exists) {
        itemData.fieldName = fieldDoc.data().name;
      }
    }
    
    const docRef = await db.collection('inventory').add(itemData);
    res.status(201).json({ id: docRef.id, ...itemData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update inventory quantity
router.put('/:id/quantity', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { quantity, operation } = req.body;
    const doc = await db.collection('inventory').doc(req.params.id).get();
    const item = doc.data();
    
    let newQuantity;
    if (operation === 'add') {
      newQuantity = item.quantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, item.quantity - quantity);
    } else {
      newQuantity = quantity;
    }
    
    const updateData = { quantity: newQuantity, lastUpdated: new Date() };
    await db.collection('inventory').doc(req.params.id).update(updateData);
    
    const updatedItem = { id: doc.id, ...item, ...updateData };
    
    // Check for low stock and emit notification
    if (newQuantity <= item.lowStockThreshold) {
      req.app.get('io').emit('low_stock_alert', updatedItem);
    }
    
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const db = req.app.get('db');
    const snapshot = await db.collection('inventory').get();
    const lowStockItems = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.quantity <= data.lowStockThreshold) {
        lowStockItems.push({ id: doc.id, ...data });
      }
    });
    
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;