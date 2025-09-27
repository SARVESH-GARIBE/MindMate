/**
 * MindMate Landing Page Scripts (vanilla JS)
 *
 * README (how to customize):
 * - Replace logo text: In index.html, find elements with class "logo" and change
 *   the text "MindMate" to your brand. There are two places: header and footer.
 * - Update brand colors: In styles.css under ":root" you can change tokens:
 *   --bg, --accent, --accent-2, --text. These cascade across components.
 *   Example:
 *     :root { --bg: #fff; --accent: #8b5cf6; --accent-2: #34d399; --text: #111827; }
 * - Button labels/microcopy: In index.html, update the CTA anchor texts.
 *
 * Accessibility notes:
 * - The mobile nav button toggles aria-expanded and a header class for visibility.
 * - Focus outlines are preserved; no JS focus suppression.
 */

(function () {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');

    if (!header || !toggle || !nav) return;

    const closeNav = () => {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openNav = () => {
        header.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        expanded ? closeNav() : openNav();
    });

    // Close on Escape for accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNav();
            toggle.focus();
        }
    });

    // Close when clicking a link (single page anchors)
    nav.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.tagName === 'A') {
            closeNav();
        }
    });
})();

