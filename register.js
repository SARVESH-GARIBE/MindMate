/**
 * MindMate Registration (vanilla JS)
 *
 * Connect to backend:
 * - Replace saveToLocalStorage() with a fetch() POST to your API.
 * - Example:
 *   fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })
 *   .then(r => r.json())
 *   .then(() => showModal())
 *   .catch(showErrors)
 *
 * Tabs persist state by keeping forms mounted and toggling [hidden].
 */

(function () {
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

        // Move focus to active panel for a11y
        (isSeeker ? panelSeeker : panelExpert).focus();
    }

    // Default to seeker visible
    activateTab(tabSeeker);

    tabSeeker.addEventListener('click', () => activateTab(tabSeeker));
    tabExpert.addEventListener('click', () => activateTab(tabExpert));

    // Allow arrow key navigation
    [tabSeeker, tabExpert].forEach((tab, idx, arr) => {
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = e.key === 'ArrowRight' ? arr[(idx + 1) % arr.length] : arr[(idx - 1 + arr.length) % arr.length];
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
        if (v.length > 254) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function validateName(value) {
        const v = String(value).trim();
        if (v.length < 2 || v.length > 60) return false;
        return /^[A-Za-zÀ-ÿ'\-\s]{2,60}$/.test(v);
    }

    function limitToMaxLength(input) {
        const max = Number(input.getAttribute('maxlength')) || 0;
        if (max > 0 && input.value.length > max) {
            input.value = input.value.slice(0, max);
        }
    }

    function setError(input, message) {
        const field = input.closest('.field');
        const error = field ? field.querySelector('.error') : null;
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
        // Include checkbox true/false
        $$('input[type="checkbox"]', form).forEach(cb => { obj[cb.name] = cb.checked; });
        return obj;
    }

    const API_BASE = (localStorage.getItem('api_base') || 'http://127.0.0.1:8000').replace(/\/$/, '');

    async function apiRegister({ username, email, password }) {
        const resp = await fetch(`${API_BASE}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (!resp.ok) {
            const err = await safeJson(resp);
            throw new Error(err?.detail || 'Registration failed');
        }
        return resp.json();
    }

    async function apiToken({ username, password }) {
        const resp = await fetch(`${API_BASE}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!resp.ok) {
            const err = await safeJson(resp);
            throw new Error(err?.detail || 'Login failed');
        }
        return resp.json();
    }

    async function safeJson(r) {
        try { return await r.json(); } catch { return null; }
    }

    function showModal() {
        const modal = $('#thanks-modal');
        modal.hidden = false;
        const btnClose = modal.querySelector('[data-close-modal]');
        btnClose.focus();

        function close() {
            modal.hidden = true;
        }
        btnClose.addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
    }

    function validateCommon({ nameInput, emailInput, passwordInput, termsInput, prefix }) {
        let ok = true;
        const name = nameInput.value.trim();
        if (!name || name.length < 2 || name.length > 60) { setError(nameInput, 'Name must be 2–60 characters.'); ok = false; }
        if (!validateEmail(emailInput.value)) { setError(emailInput, 'Please enter a valid email.'); ok = false; }
        if (!passwordInput.value || passwordInput.value.length < 8 || passwordInput.value.length > 128) { setError(passwordInput, 'Password must be 8–128 characters.'); ok = false; }
        if (!termsInput.checked) { setError(termsInput, 'You must agree to the terms.'); ok = false; }
        return ok;
    }

    function attachLiveValidation(form) {
        form.addEventListener('input', (e) => {
            const input = e.target;
            if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) return;
            // Hard-limit by maxlength if present
            limitToMaxLength(input);
            // Basic live checks
            if (input.type === 'email') {
                setError(input, validateEmail(input.value) ? '' : 'Please enter a valid email.');
            } else if (input.name === 'password') {
                setError(input, input.value.length >= 8 ? '' : 'Password must be at least 8 characters.');
            } else if (input.id === 'seeker-name' || input.id === 'expert-name') {
                setError(input, validateName(input.value) ? '' : 'Use 2–60 letters, spaces, apostrophes or hyphens.');
            } else if (input.type === 'checkbox' && input.required) {
                setError(input, input.checked ? '' : 'You must agree to the terms.');
            } else if (input.required) {
                setError(input, input.value.trim() ? '' : 'This field is required.');
            } else {
                setError(input, '');
            }
        });
    }

    attachLiveValidation(formSeeker);
    attachLiveValidation(formExpert);

    formSeeker.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(formSeeker);
        const ok = validateCommon({
            nameInput: $('#seeker-name'),
            emailInput: $('#seeker-email'),
            passwordInput: $('#seeker-password'),
            termsInput: $('#seeker-terms')
        });
        if (!ok || !validateName($('#seeker-name').value)) { setError($('#seeker-name'), 'Use 2–60 valid characters.'); return; }
        const ageVal = Number($('#seeker-age')?.value || 0);
        if (ageVal && (ageVal < 0 || ageVal > 120)) { setError($('#seeker-age'), 'Age must be between 0 and 120.'); return; }
        const data = gatherFormData(formSeeker);
        const username = (data.email || '').trim();
        const email = (data.email || '').trim();
        const password = data.password;
        try {
            await apiRegister({ username, email, password });
        } catch (e) {
            setError($('#seeker-email'), e.message || 'Registration failed');
            return;
        }
        try {
            const tokens = await apiToken({ username, password });
            localStorage.setItem('auth_access', tokens.access);
            localStorage.setItem('auth_refresh', tokens.refresh);
            localStorage.setItem('auth_username', username);
            localStorage.setItem('auth_role', 'seeker');
        } catch (e) {
            // proceed without token
        }
        showModal();
    });

    formExpert.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors(formExpert);
        const ok = validateCommon({
            nameInput: $('#expert-name'),
            emailInput: $('#expert-email'),
            passwordInput: $('#expert-password'),
            termsInput: $('#expert-terms')
        });
        if (!ok || !validateName($('#expert-name').value)) { setError($('#expert-name'), 'Use 2–60 valid characters.'); return; }
        const data = gatherFormData(formExpert);
        const username = (data.email || '').trim();
        const email = (data.email || '').trim();
        const password = data.password;
        try {
            await apiRegister({ username, email, password });
        } catch (e) {
            setError($('#expert-email'), e.message || 'Registration failed');
            return;
        }
        try {
            const tokens = await apiToken({ username, password });
            localStorage.setItem('auth_access', tokens.access);
            localStorage.setItem('auth_refresh', tokens.refresh);
            localStorage.setItem('auth_username', username);
            localStorage.setItem('auth_role', 'expert');
        } catch (e) {
            // proceed without token
        }
        showModal();
    });
})();


