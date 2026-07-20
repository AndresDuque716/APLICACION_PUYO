import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ------------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE PARA VENDIX
// Proyecto oficial: vendix-3cedd
// Package Name: com.vendixapp.puyo
// ------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDgPjcCEDVlq566zhIvPFSSNX5DrwFTuEI",
  authDomain: "vendix-3cedd.firebaseapp.com",
  projectId: "vendix-3cedd",
  storageBucket: "vendix-3cedd.firebasestorage.app",
  messagingSenderId: "280749789909",
  appId: "1:280749789909:android:46121f2c35eabbcdfd885c"
};

// Detectar si las credenciales oficiales están configuradas
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY");

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    db = getFirestore(app);
    console.log("🔥 Firebase inicializado con éxito para vendix-3cedd.");
  } catch (error) {
    console.error("⚠️ Error inicializando Firebase:", error);
  }
} else {
  console.log("ℹ️ Firebase no configurado. Utilizando base de datos local.");
}

export { app, auth, db, isFirebaseConfigured };
