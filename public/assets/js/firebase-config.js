/*
 * KAZE Firebase Web App configuration.
 * Web config values are intended for the browser and are not admin credentials.
 * Protect the project with Firebase Authentication settings and server-side authorization.
 * NEVER place a Firebase service-account private key or Admin SDK credentials in this file.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyA-qQi1WwcLVsBR6viX2WpbGZ1NadFyJ4",
  authDomain: "kaze-store.firebaseapp.com",
  projectId: "kaze-store",
  storageBucket: "kaze-store.firebasestorage.app",
  messagingSenderId: "174107153921",
  appId: "1:174107153921:web:6e373f13fd8027c9ab1200",
  measurementId: "G-K8BM71B4EC"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0 && !value.startsWith("REPLACE_ME")
);
