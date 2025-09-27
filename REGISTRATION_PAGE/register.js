// register.js - Final version with Firebase integration + error logging
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyArBlnZYOEl-diUNkV0jY4UapC_2syaF4c",
  authDomain: "mindmate-7a682.firebaseapp.com",
  projectId: "mindmate-7a682",
  storageBucket: "mindmate-7a682.appspot.com", // ✅ fixed
  messagingSenderId: "83131192394",
  appId: "1:83131192394:web:3798586808d55aa55b82b3"
};

// Initialize Firebase and get service instances
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Tabs
const tabSeeker = $('#tab-seeker');
const tabExpert = $('#tab-expert');
const panelSeeker = $('#panel-seeker');
const panelExpert = $('#panel-expert');

function activateTab(tab) {
  const isSeeker = tab === tabSeeker;
  tabSeeker.setAttribute('aria-selected', String(isSeeker));
  tabExpert.setAttribute('aria-selected', String(!isSeeker));
  panelSeeker.hidden = !isSeeker;
  panelExpert.hidden = isSeeker;
  (isSeeker ? panelSeeker : panelExpert).focus();
}

activateTab(tabSeeker);
tabSeeker.addEventListener('click', () => activateTab(tabSeeker));
tabExpert.addEventListener('click', () => activateTab(tabExpert));

// Arrow key navigation for tabs
[tabSeeker, tabExpert].forEach((tab, idx, arr) => {
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight'
        ? arr[(idx + 1) % arr.length]
        : arr[(idx - 1 + arr.length) % arr.length];
      next.focus();
      activateTab(next);
    }
  });
});

// Forms
const formSeeker = $('#form-seeker');
const formExpert = $('#form-expert');

function validateEmail(value) {
  const v = String(value).trim();
  return v.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateName(value) {
  const v = String(value).trim();
  return v.length >= 2 && v.length <= 60 && /^[A-Za-zÀ-ÿ'\-\s]{2,60}$/.test(v);
}

function setError(input, message) {
  const field = input.closest('.field');
  const error = field?.querySelector('.error');
  if (error) {
    error.textContent = message || '';
  }
  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
}

function clearErrors(form) {
  $$('.error', form).forEach(e => e.textContent = '');
  $$('input[aria-invalid], textarea[aria-invalid]', form).forEach(i => i.removeAttribute('aria-invalid'));
}

function gatherFormData(form) {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) {
    obj[key] = value;
  }
  $$('input[type="checkbox"]', form).forEach(cb => { obj[cb.name] = cb.checked; });
  return obj;
}

function showModal() {
  const modal = $('#thanks-modal');
  modal.hidden = false;
  const btnClose = modal.querySelector('[data-close-modal]');
  btnClose.focus();

  function close() { modal.hidden = true; }
  btnClose.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
}

function validateCommon({ nameInput, emailInput, passwordInput, termsInput }) {
  let ok = true;
  if (!validateName(nameInput.value)) { setError(nameInput, 'Name must be 2–60 characters.'); ok = false; }
  if (!validateEmail(emailInput.value)) { setError(emailInput, 'Please enter a valid email.'); ok = false; }
  if (!passwordInput.value || passwordInput.value.length < 8) { setError(passwordInput, 'Password must be at least 8 characters.'); ok = false; }
  if (!termsInput.checked) { setError(termsInput, 'You must agree to the terms.'); ok = false; }
  return ok;
}

// Removed attachLiveValidation() calls because they weren’t defined

// Seeker form
formSeeker.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(formSeeker);
  const data = gatherFormData(formSeeker);
  const { fullName, email, password, age, concern, note } = data;

  if (!validateCommon({
    nameInput: $('#seeker-name'),
    emailInput: $('#seeker-email'),
    passwordInput: $('#seeker-password'),
    termsInput: $('#seeker-terms')
  })) return;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: fullName,
      email,
      role: 'seeker',
      age: age || null,
      concern: concern || '',
      note: note || '',
      createdAt: new Date().toISOString()
    });

    showModal();
  } catch (error) {
    console.error("Firestore/Seeker Error:", error); // ✅ log to console
    setError($('#seeker-email'), error.message || 'Registration failed');
  }
});

// Expert form
formExpert.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(formExpert);
  const data = gatherFormData(formExpert);
  const { fullName, email, password, profession, bio, availability } = data;

  if (!validateCommon({
    nameInput: $('#expert-name'),
    emailInput: $('#expert-email'),
    passwordInput: $('#expert-password'),
    termsInput: $('#expert-terms')
  })) return;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: fullName,
      email,
      role: 'expert',
      profession: profession || '',
      bio: bio || '',
      availability: availability || '',
      createdAt: new Date().toISOString()
    });

    showModal();
  } catch (error) {
    console.error("Firestore/Expert Error:", error); // ✅ log to console
    setError($('#expert-email'), error.message || 'Registration failed');
  }
});
