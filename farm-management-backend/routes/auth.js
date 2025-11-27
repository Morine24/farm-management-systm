const express = require('express');
const router = express.Router();

// Simple auth placeholder - in production, implement proper JWT authentication
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - replace with real auth logic
  if (email && password) {
    res.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        name: 'Farm Manager',
        email: email,
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.get('/me', (req, res) => {
  // Mock user data - replace with real JWT verification
  res.json({
    id: '1',
    name: 'Farm Manager',
    email: 'manager@farm.com',
    role: 'admin'
  });
});

module.exports = router;