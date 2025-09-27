import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyArBlnZYOEl-diUNkV0jY4UapC_2syaF4c",
  authDomain: "mindmate-7a682.firebaseapp.com",
  projectId: "mindmate-7a682",
  storageBucket: "mindmate-7a682.firebasestorage.app",
  messagingSenderId: "83131192394",
  appId: "1:83131192394:web:3798586808d55aa55b82b3"
};

// Initialize Firebase and get service instances
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM selectors
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const googleLoginBtn = document.getElementById('google-login-btn');
const errorMessageDiv = document.getElementById('error-message');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');
const formTitle = document.getElementById('form-title');
const authBtn = document.getElementById('auth-btn');
const toggleForm = document.getElementById('toggle-form');

// State for login/signup toggle
let isLogin = true;

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeToggle.textContent = document.body.classList.contains('light-mode') ? "Dark Mode" : "Light Mode";
});

// Login/Signup form toggle
toggleForm.addEventListener('click', () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "Login" : "Sign Up";
  authBtn.textContent = isLogin ? "Login" : "Sign Up";
  toggleForm.textContent = isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login";
  errorMessageDiv.style.display = "none";
});

// Event listener for Email/Password login/signup
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  
  try {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name: email,
        email: user.email,
        role: 'seeker', 
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    errorMessageDiv.textContent = error.message;
  }
});

// Event listener for Google Sign-in
googleLoginBtn.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName,
        email: user.email,
        role: 'seeker', 
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    errorMessageDiv.textContent = error.message;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// onAuthStateChanged is the listener that handles redirects
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in, log the login event
        const loginLogsCollection = collection(db, "login_logs");
        await addDoc(loginLogsCollection, {
            userId: user.uid,
            email: user.email,
            timestamp: serverTimestamp()
        });
        
        window.location.href = 'dashboard.html';
    } else {
        loginForm.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});