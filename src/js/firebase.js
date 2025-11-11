import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsZ2luMQAqmnwk0y6-vJ1gzKkMd1NKFuc",
  authDomain: "timora-2680a.firebaseapp.com",
  projectId: "timora-2680a",
  storageBucket: "timora-2680a.firebasestorage.app",
  messagingSenderId: "1036436572315",
  appId: "1:1036436572315:web:58b1ecb4cb84045aaa5e3e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
