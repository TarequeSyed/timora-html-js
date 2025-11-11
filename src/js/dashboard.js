// dashboard.js - Alternative modular version if you prefer ES6 imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsZ2luMQAqmnwk0y6-vJ1gzKkMd1NKFuc",
  authDomain: "timora-2680a.firebaseapp.com",
  projectId: "timora-2680a",
  storageBucket: "timora-2680a.firebasestorage.app",
  messagingSenderId: "1036436572315",
  appId: "1:1036436572315:web:58b1ecb4cb84045aaa5e3e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loaderEl = document.getElementById('loader');
const dashboardEl = document.getElementById('dashboard');
const nameEl = document.getElementById('userName');
const emailEl = document.getElementById('userEmail');
const avatarEl = document.getElementById('userAvatar');
const usernameEl = document.getElementById('userUsername');
const coinsEl = document.getElementById('userCoins');
const subscriptionEl = document.getElementById('userSubscription');
const logoutBtn = document.getElementById('logoutBtn');

// Logout handler
logoutBtn?.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '/login.html';
  } catch (err) {
    console.error('Logout error:', err);
    alert('Error logging out. Please try again.');
  }
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user);

  if (!user) {
    loaderEl.textContent = "Not logged in. Redirecting...";
    setTimeout(() => (window.location.href = "/login.html"), 1000);
    return;
  }

  // Check if email/password user is verified
  const isEmailUser = user.providerData.some(p => p.providerId === "password");
  if (isEmailUser && !user.emailVerified) {
    loaderEl.textContent = "Please verify your email first.";
    setTimeout(() => (window.location.href = "/login.html"), 1500);
    return;
  }

  // Fetch Firestore user doc
  try {
    const userDocRef = doc(db, "users", user.uid);
    console.log("Fetching Firestore doc:", userDocRef.path);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.warn("User data not found in Firestore.");

      // Auto-create doc for OAuth users (Google)
      const isOAuthUser = user.providerData.some(p => p.providerId !== "password");
      if (isOAuthUser) {
        const username = (user.displayName || user.email.split('@')[0]).replace(/\s+/g, "_").toLowerCase();
        const logoUrl = user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || user.uid)}`;

        const payload = {
          uid: user.uid,
          name: user.displayName || username,
          username: username,
          email: user.email || '',
          logoUrl: logoUrl,
          avatarSeed: user.email || user.uid,
          coins: 10,
          subscription: "free",
          totalFocusHours: 0,
          currentStreak: 0,
          achievements: [],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };

        await setDoc(userDocRef, payload);
        console.log("Auto-created Firestore user doc for OAuth user:", payload);

        // Display the newly created user data
        displayUserData(payload, user);
        return;
      }

      // For email/password users without doc (should be rare)
      loaderEl.textContent = "No user profile found. Please sign up again or contact support.";
      return;
    }

    // Normal flow: doc exists
    const data = userDoc.data();
    console.log("Firestore doc data:", data);
    displayUserData(data, user);

  } catch (err) {
    console.error("Error fetching user data:", err);
    loaderEl.textContent = "Error loading user data. Check console.";
  }
});

function displayUserData(data, user) {
  nameEl.textContent = data.name || "Unnamed User";
  emailEl.textContent = data.email || user.email;
  avatarEl.src = data.logoUrl || user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.email || user.uid)}`;
  
  if (usernameEl) usernameEl.textContent = data.username || "-";
  if (coinsEl) coinsEl.textContent = data.coins || 0;
  if (subscriptionEl) subscriptionEl.textContent = data.subscription || "free";

  loaderEl.classList.add("hidden");
  dashboardEl.classList.remove("hidden");
}