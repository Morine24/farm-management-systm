const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./farm-management-backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdmin() {
  try {
    // Create admin user
    const adminUser = {
      name: 'Farm Administrator',
      email: 'admin@farm.com',
      role: 'admin',
      phone: '+1234567890',
      status: 'active',
      password: 'Karibu@123',
      isDefaultPassword: true,
      createdAt: new Date()
    };

    const docRef = await db.collection('users').add(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@farm.com');
    console.log('🔑 Password: Karibu@123');
    console.log('🆔 User ID:', docRef.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();