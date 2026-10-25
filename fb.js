// ع الحلة — Firebase (shared by index / track / admin)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, collection, setDoc, getDoc, onSnapshot, serverTimestamp, query, orderBy, limit, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCtSigtOrUVd8j8yXOocaPCobv8LhBUWtA",
  authDomain: "al7ella.firebaseapp.com",
  projectId: "al7ella",
  storageBucket: "al7ella.firebasestorage.app",
  messagingSenderId: "929204702741",
  appId: "1:929204702741:web:fc7e69cb7fcf1d651c081c",
  measurementId: "G-EPB6MMGYDX"
};
export const ADMINS = ["hamdyuwk1@gmail.com"];
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const STATUS = [
  ["new", "اتسجل", "📝"],
  ["confirmed", "اتأكد", "✅"],
  ["cooking", "بيتجهز في المطبخ", "🍳"],
  ["out", "خرج للتوصيل", "🛵"],
  ["delivered", "وصل", "🎉"]
];
export const STATUS_X = ["cancelled", "اتلغى", "✖️"];
export { doc, collection, setDoc, getDoc, onSnapshot, serverTimestamp, query, orderBy, limit, updateDoc, deleteDoc };
