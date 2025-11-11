// src/js/auth.js
// ES module that handles auth UI + Firebase signup/signin + user doc creation
// Assumes src/js/firebase.js exports `auth` and `db` (modular SDK).

import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* -------------------------
   Helpers
   ------------------------- */

// sanitize a name -> username (lowercase, underscores, remove invalid chars)
function makeUsername(nameOrEmail) {
  if (!nameOrEmail) return "user_" + Math.random().toString(36).slice(2, 9);
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  return base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30) || "user_" + Math.random().toString(36).slice(2, 9);
}

// dicebear avatar generator (seeded)
function generateAvatar(emailOrSeed) {
  const seeds = ["adventurer", "avataaars", "bottts", "croodles", "pixel-art"];
  const style = seeds[Math.floor(Math.random() * seeds.length)];
  const seed = encodeURIComponent(emailOrSeed || `user${Math.floor(Math.random()*10000)}`);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

function showMessage(message, type = "info") {
  const box = document.getElementById("messageBox");
  if (!box) return;
  box.className = "";
  box.classList.add("rounded-xl", "p-3", "text-sm", "mb-4");
  if (type === "error") {
    box.classList.add("bg-red-50", "text-red-700", "border", "border-red-100");
  } else if (type === "success") {
    box.classList.add("bg-green-50", "text-green-700", "border", "border-green-100");
  } else {
    box.classList.add("bg-blue-50", "text-slate-700", "border", "border-blue-100");
  }
  box.textContent = message;
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 5000);
}

/* -------------------------
   DOM refs & tab UI
   ------------------------- */
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

if (loginTab && signupTab) {
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("bg-gradient-to-r","from-[var(--primary)]","to-[var(--secondary)]","text-white");
    signupTab.classList.remove("bg-gradient-to-r","from-[var(--primary)]","to-[var(--secondary)]","text-white");
    signupTab.classList.add("text-slate-600");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  });

  signupTab.addEventListener("click", () => {
    signupTab.classList.add("bg-gradient-to-r","from-[var(--primary)]","to-[var(--secondary)]","text-white");
    loginTab.classList.remove("bg-gradient-to-r","from-[var(--primary)]","to-[var(--secondary)]","text-white");
    loginTab.classList.add("text-slate-800");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });
}

/* -------------------------
   Email Sign In
   ------------------------- */
const loginFormElement = document.getElementById("loginFormElement");
if (loginFormElement) {
  loginFormElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const btnText = document.getElementById("loginBtnText");
    const spinner = document.getElementById("loginSpinner");

    btnText.textContent = "Signing in...";
    spinner?.classList.remove("hidden");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // If account created via email/password - ensure verified
      if (!cred.user.emailVerified) {
        showMessage("Please verify your email before signing in.", "info");
        await signOut(auth);
        return;
      }
      showMessage("Login successful — redirecting...", "success");
      setTimeout(() => (window.location.href = "/dashboard.html"), 900);
    } catch (err) {
      console.error("Login error:", err);
      showMessage(err?.message || "Login failed", "error");
    } finally {
      btnText.textContent = "Sign In";
      spinner?.classList.add("hidden");
    }
  });
}

/* -------------------------
   Email Sign Up
   ------------------------- */
const signupFormElement = document.getElementById("signupFormElement");
if (signupFormElement) {
  signupFormElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirmPassword").value;
    const btnText = document.getElementById("signupBtnText");
    const spinner = document.getElementById("signupSpinner");

    if (password !== confirm) { showMessage("Passwords do not match", "error"); return; }

    btnText.textContent = "Creating...";
    spinner?.classList.remove("hidden");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // derive username from full name (or email local-part)
      const username = makeUsername(name || email);

      // generate seeded avatar for email signups
      const avatar = generateAvatar(email);

      // update firebase user profile (photoURL + displayName)
      try {
        await updateProfile(user, { displayName: name || username, photoURL: avatar });
      } catch (uErr) {
        console.warn("updateProfile failed:", uErr);
      }

      // send verification email
      try {
        await sendEmailVerification(user);
      } catch (verErr) {
        console.warn("sendEmailVerification failed:", verErr);
      }

      // create Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name || username,
        username: username,
        email: email,
        logoUrl: avatar,
        avatarSeed: email,
        coins: 10,
        subscription: "free",
        totalFocusHours: 0,
        currentStreak: 0,
        achievements: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      showMessage("Account created — please check your inbox to verify your email.", "success");

      // sign the user out so they verify email first
      await signOut(auth);

      // switch to login tab visually after a short delay
      setTimeout(() => loginTab.click(), 1200);
    } catch (err) {
      console.error("Signup error:", err);
      showMessage(err?.message || "Signup failed", "error");
    } finally {
      btnText.textContent = "Create account";
      spinner?.classList.add("hidden");
    }
  });
}

/* -------------------------
   Google Sign-in (Sign-up)
   ------------------------- */
async function handleGoogleAuth() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // preferred username from Google displayName or fallback
    const username = makeUsername(user.displayName || user.email || user.uid);

    // logo photo url: prefer Google photoURL; if missing, generate a seeded avatar
    const logoUrl = user.photoURL || generateAvatar(user.email || user.uid);

    // ensure user doc exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      // Create a new user doc for first-time Google sign-ins
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || username,
        username: username,
        email: user.email,
        logoUrl: logoUrl,
        avatarSeed: user.email || user.uid,
        coins: 10,
        subscription: "free",
        totalFocusHours: 0,
        currentStreak: 0,
        achievements: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // Ensure user profile has photoURL + displayName set
      try {
        await updateProfile(user, { displayName: user.displayName || username, photoURL: logoUrl });
      } catch (updateErr) {
        console.warn("updateProfile after Google sign-in failed:", updateErr);
      }
    } else {
      // Update lastLogin timestamp for returning users
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(() => {});
    }

    showMessage("Login successful — redirecting...", "success");
    setTimeout(() => (window.location.href = "/dashboard.html"), 800);
  } catch (err) {
    console.error("Google auth error:", err);
    showMessage(err?.message || "Google sign-in failed", "error");
  }
}
document.getElementById("googleLoginBtn")?.addEventListener("click", handleGoogleAuth);
document.getElementById("googleSignupBtn")?.addEventListener("click", handleGoogleAuth);

/* -------------------------
   Forgot password handler
   ------------------------- */
document.getElementById("forgotPasswordLink")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) { showMessage("Enter your email to receive reset link", "info"); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset sent — check your inbox", "success");
  } catch (err) {
    console.error("Password reset error:", err);
    showMessage(err?.message || "Reset failed", "error");
  }
});

/* -------------------------
   Redirect if already logged-in & verified (for email accounts)
   ------------------------- */
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  // If user signed up with email/password and hasn't verified email, don't redirect
  // For OAuth users (Google), emailVerified is usually true
  if (user.providerData.some(pd => pd.providerId === "password") && !user.emailVerified) {
    // Email/password account but not verified — keep them on the login page
    return;
  }
  // Otherwise redirect
  window.location.href = "/dashboard.html";
});
