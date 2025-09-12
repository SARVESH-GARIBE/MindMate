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
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
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

    function saveToLocalStorage(key, obj) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(obj);
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            // no-op
        }
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
        if (!nameInput.value.trim()) { setError(nameInput, 'Please enter your full name.'); ok = false; }
        if (!validateEmail(emailInput.value)) { setError(emailInput, 'Please enter a valid email.'); ok = false; }
        if (!passwordInput.value || passwordInput.value.length < 8) { setError(passwordInput, 'Password must be at least 8 characters.'); ok = false; }
        if (!termsInput.checked) { setError(termsInput, 'You must agree to the terms.'); ok = false; }
        return ok;
    }

    function attachLiveValidation(form) {
        form.addEventListener('input', (e) => {
            const input = e.target;
            if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement)) return;
            // Basic live checks
            if (input.type === 'email') {
                setError(input, validateEmail(input.value) ? '' : 'Please enter a valid email.');
            } else if (input.name === 'password') {
                setError(input, input.value.length >= 8 ? '' : 'Password must be at least 8 characters.');
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

    formSeeker.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(formSeeker);
        const ok = validateCommon({
            nameInput: $('#seeker-name'),
            emailInput: $('#seeker-email'),
            passwordInput: $('#seeker-password'),
            termsInput: $('#seeker-terms')
        });
        if (!ok) return;
        const user = { role: 'seeker', ...gatherFormData(formSeeker) };
        saveToLocalStorage('registrations', user);
        showModal();
    });

    formExpert.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(formExpert);
        const ok = validateCommon({
            nameInput: $('#expert-name'),
            emailInput: $('#expert-email'),
            passwordInput: $('#expert-password'),
            termsInput: $('#expert-terms')
        });
        if (!ok) return;
        const user = { role: 'expert', ...gatherFormData(formExpert) };
        saveToLocalStorage('registrations', user);
        showModal();
    });
})();


