/**
 * app.js
 * Application bootstrap — initialises all modules and
 * determines the initial view based on session state.
 *
 * Load order (defined in index.html):
 *   config.js → api.js → auth.js → ui.js → reimbursements.js
 *   → employees.js → roles.js → router.js → app.js
 */

(async function bootstrap() {
  // ── 1. Show global loader while we check session ────────
  const globalLoader = document.getElementById('global-loader');
  globalLoader.classList.remove('hidden');

  // ── 2. Initialise UI helpers ─────────────────────────────
  UI.hydrateIcons();
  UI.initModal();
  Router.init();
  Auth.init();
  Reimbursements.init();
  Employees.init();
  Roles.init();

  // ── 3. Restore cached user (prevents flicker on refresh) ─
  const cachedUser = Auth.restoreUser();

  // ── 4. Verify session against backend ────────────────────
  //    Try to hit an authenticated endpoint. If the session
  //    cookie is valid, the server responds with 200 and we
  //    stay logged in. Otherwise we redirect to login.
  //
  //    We use GET /rest/reimbursements as a lightweight probe
  //    (every role has access to it when authenticated).

  let verified = false;

  if (cachedUser) {
    try {
      await API.get(CONFIG.ENDPOINTS.REIMBURSEMENTS);
      verified = true;
    } catch (err) {
      // 401 → session expired / not logged in
      if (err.status === 401) {
        Auth.setCurrentUser(null);
      }
      // Network error or other → still try showing the app,
      // individual API calls will surface errors.
      if (err.status === 0) {
        // Network error — assume session might still be valid
        // (will fail gracefully when views load)
        verified = true;
      }
    }
  }

  // ── 5. Route to the correct section ──────────────────────
  globalLoader.classList.add('hidden');

  if (verified && Auth.getCurrentUser()) {
    Router.showAppSection(Auth.getCurrentUser());
  } else {
    Router.showAuthSection();
  }
})();
