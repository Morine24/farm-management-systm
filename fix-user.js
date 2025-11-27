const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./farm-management-backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixUser() {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', 'morineemaina@gmail.com').get();
    
    if (snapshot.empty) {
      console.log('❌ User not found with email: morineemaina@gmail.com');
      
      // Create the user if not found
      const newUser = {
        name: 'Morine Emaina',
        email: 'morineemaina@gmail.com',
        role: 'admin',
        phone: '+1234567890',
        status: 'active',
        password: 'Karibu@123',
        isDefaultPassword: true,
        createdAt: new Date()
      };

      const docRef = await db.collection('users').add(newUser);
      console.log('✅ User created successfully!');
      console.log('📧 Email: morineemaina@gmail.com');
      console.log('🔑 Password: Karibu@123');
      console.log('🆔 User ID:', docRef.id);
    } else {
      // Update existing user with password
      const userDoc = snapshot.docs[0];
      await userDoc.ref.update({
        password: 'Karibu@123',
        isDefaultPassword: true
      });
      
      console.log('✅ User updated successfully!');
      console.log('📧 Email: morineemaina@gmail.com');
      console.log('🔑 Password: Karibu@123');
      console.log('🆔 User ID:', userDoc.id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUser();