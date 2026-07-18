/**
 * icons.js
 * Minimal stroke-based SVG icon set — replaces emoji glyphs everywhere
 * in the UI so the app doesn't read as an emoji-decorated template.
 * Every icon inherits color via stroke="currentColor" and is sized
 * to 1em by the .icon wrapper class (see components.css).
 */

const Icons = (() => {
  const svg = (inner, viewBox = '0 0 20 20') => `
    <svg class="icon" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${inner}
    </svg>`.trim();

  const paths = {
    logomark: svg(`<rect x="2.5" y="6.5" width="15" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M2.5 11h15" stroke="currentColor" stroke-width="1.5"/>`),

    dashboard: svg(`<rect x="2.5" y="2.5" width="6" height="7" rx="1.2" stroke="currentColor" stroke-width="1.5"/>
      <rect x="11.5" y="2.5" width="6" height="4" rx="1.2" stroke="currentColor" stroke-width="1.5"/>
      <rect x="11.5" y="9.5" width="6" height="8" rx="1.2" stroke="currentColor" stroke-width="1.5"/>
      <rect x="2.5" y="12.5" width="6" height="5" rx="1.2" stroke="currentColor" stroke-width="1.5"/>`),

    submitClaim: svg(`<path d="M6 2.5h6l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M10 8.5v5M7.5 11h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),

    review: svg(`<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12.7 12.7 17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),

    employees: svg(`<circle cx="7" cy="6.5" r="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M1.8 17c.5-3.2 2.9-5 5.2-5s4.7 1.8 5.2 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="14.5" cy="7" r="2.2" stroke="currentColor" stroke-width="1.4"/>
      <path d="M13 17c.3-2 1.6-4 4.2-4.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`),

    roles: svg(`<path d="M10 2.2 16.5 5v4.6c0 4.4-2.8 7.6-6.5 8.2-3.7-.6-6.5-3.8-6.5-8.2V5L10 2.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M7.3 10 9.2 11.9 12.9 8.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),

    logout: svg(`<path d="M8 17H4.5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4.5 3H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M13 13.5 17 10l-4-3.5M17 10H7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),

    menu: svg(`<path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`),

    close: svg(`<path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`),

    check: svg(`<path d="M4 10.5 8 14.5 16 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),

    cross: svg(`<path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),

    info: svg(`<circle cx="10" cy="10" r="7.2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 9.2v4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="10" cy="6.7" r="0.9" fill="currentColor"/>`),

    eye: svg(`<path d="M1.7 10S4.5 4.5 10 4.5 18.3 10 18.3 10 15.5 15.5 10 15.5 1.7 10 1.7 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" stroke-width="1.5"/>`),

    eyeOff: svg(`<path d="M2.5 2.5l15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8.3 5.1C8.85 4.9 9.4 4.8 10 4.8c5.5 0 8.3 5.2 8.3 5.2a15 15 0 0 1-2.7 3.4M5.6 6.4A14.7 14.7 0 0 0 1.7 10s2.8 5.2 8.3 5.2c1 0 1.9-.15 2.7-.45" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.1 10a1.9 1.9 0 0 0 2.7 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),

    clock: svg(`<circle cx="10" cy="10" r="7.2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 6v4.2l3 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),

    empty: svg(`<path d="M3 8.5 5 3h10l2 5.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M3 8.5h4.2c.3 1.2 1.3 2 2.8 2s2.5-.8 2.8-2H17v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`, '0 0 20 22'),

    search: svg(`<circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12.6 12.6 17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),

    refresh: svg(`<path d="M16 6.5A6.5 6.5 0 1 0 17.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M16 2.5v4.4h-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),

    chevronLeft: svg(`<path d="M12.5 4.5 6.5 10l6 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`),

    arrow: svg(`<path d="M4 10h11.5M11 5.5 15.5 10 11 14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`),
  };

  /** Returns the raw SVG markup string for the named icon. */
  function html(name) {
    return paths[name] || '';
  }

  return { html };
})();
