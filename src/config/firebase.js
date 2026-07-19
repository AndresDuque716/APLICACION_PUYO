import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ------------------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE PARA VENDIX
// ------------------------------------------------------------------------
// Instrucciones para el usuario:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto gratuito llamado "Vendix"
// 3. Agrega una aplicación de tipo "Web" y copia la configuración aquí.
// 4. Activa "Autenticación por Correo/Contraseña" en la pestaña Authentication.
// 5. Crea una base de datos "Cloud Firestore" en modo prueba.
// ------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Detectar si el usuario ya ingresó sus credenciales de Firebase
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

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
    console.log("🔥 Firebase inicializado con éxito.");
  } catch (error) {
    console.error("⚠️ Error inicializando Firebase:", error);
  }
} else {
  console.log("ℹ️ Firebase no configurado. Utilizando base de datos local.");
}

export { app, auth, db, isFirebaseConfigured };
