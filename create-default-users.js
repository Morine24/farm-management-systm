const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./farm-management-backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createDefaultUsers() {
  try {
    const defaultUsers = [
      {
        name: 'System Administrator',
        email: 'admin@farm.com',
        role: 'admin',
        phone: '+1234567890',
        status: 'active',
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      },
      {
        name: 'Farm Manager',
        email: 'manager@farm.com',
        role: 'manager',
        phone: '+1234567891',
        status: 'active',
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      },
      {
        name: 'Financial Manager',
        email: 'finance@farm.com',
        role: 'financial_manager',
        phone: '+1234567892',
        status: 'active',
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      },
      {
        name: 'Farm Worker',
        email: 'worker@farm.com',
        role: 'worker',
        phone: '+1234567893',
        status: 'active',
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      }
    ];

    console.log('🔐 CREATING DEFAULT USER ACCOUNTS:\n');
    console.log('=' .repeat(60));

    for (const user of defaultUsers) {
      const docRef = await db.collection('users').add(user);
      console.log(`✅ ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${user.password}`);
      console.log(`👔 Role: ${user.role.toUpperCase()}`);
      console.log(`🆔 ID: ${docRef.id}`);
      console.log('-'.repeat(40));
    }
    
    console.log('\n🎉 All default users created successfully!');
    console.log('💡 Use any of the above credentials to login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDefaultUsers();