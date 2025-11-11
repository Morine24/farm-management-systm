import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCn3NIHH948cIQm0rVinKu7_5b02Bc-Cno",
  authDomain: "oloosian-farm.firebaseapp.com",
  projectId: "oloosian-farm",
  storageBucket: "oloosian-farm.firebasestorage.app",
  messagingSenderId: "841261641161",
  appId: "1:841261641161:web:f4f02b96d0795530b98c18",
  measurementId: "G-QNFJ7T63MW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;