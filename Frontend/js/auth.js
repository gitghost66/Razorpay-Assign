/**
 * auth.js
 * Handles login, registration, and logout flows.
 * Also provides the in-memory user state getter/setter used
 * by other modules.
 */

const Auth = (() => {
  // ── State ────────────────────────────────────────────────
  let _currentUser = null; // { userId, name, email, role }

  /* ── Public getters / setters ─────────────────────────── */
  function getCurrentUser() { return _currentUser; }

  function setCurrentUser(user) {
    _currentUser = user;
    if (user) {
      sessionStorage.setItem('reimburse_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('reimburse_user');
    }
  }

  /** Restore user from sessionStorage after page refresh. */
  function restoreUser() {
    try {
      const raw = sessionStorage.getItem('reimburse_user');
      if (raw) _currentUser = JSON.parse(raw);
    } catch { /* ignore */ }
    return _currentUser;
  }

  function isLoggedIn() { return _currentUser !== null; }

  /* ── Input Validation ─────────────────────────────────── */

  /** Returns null if valid, or an error message string. */
  function validateEmail(email) {
    if (!email) return 'Email is required.';
    if (!email.endsWith('@org.com')) return 'Email must be a @org.com address.';
    return null;
  }

  function validatePassword(password, minLength = 6) {
    if (!password) return 'Password is required.';
    if (password.length < minLength) return `Password must be at least ${minLength} characters.`;
    return null;
  }

  /* ── Login ────────────────────────────────────────────── */
  async function handleLogin(e) {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Client-side validation
    let hasError = false;
    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);

    UI.setFieldError('login-email-error',    emailErr);
    UI.setFieldError('login-password-error', passwordErr);

    if (emailErr || passwordErr) return;

    UI.setButtonLoading('login-submit-btn', true);

    try {
      const res = await API.post(CONFIG.ENDPOINTS.LOGIN, { email, password });
      setCurrentUser(res.data);
      UI.showToast('Welcome back, ' + res.data.name + '!', 'success');
      Router.navigateTo('dashboard');
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading('login-submit-btn', false);
    }
  }

  /* ── Register ─────────────────────────────────────────── */
  async function handleRegister(e) {
    e.preventDefault();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    // Validation
    let hasError = false;
    const nameErr     = name     ? null : 'Full name is required.';
    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);

    UI.setFieldError('reg-name-error',     nameErr);
    UI.setFieldError('reg-email-error',    emailErr);
    UI.setFieldError('reg-password-error', passwordErr);

    if (nameErr || emailErr || passwordErr) return;

    UI.setButtonLoading('register-submit-btn', true);

    try {
      const res = await API.post(CONFIG.ENDPOINTS.REGISTER, { name, email, password });
      UI.showToast('Account created! Please sign in.', 'success');
      // Redirect to login and prefill email
      Router.showAuthPage('login');
      document.getElementById('login-email').value = email;
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading('register-submit-btn', false);
    }
  }

  /* ── Logout ───────────────────────────────────────────── */
  async function handleLogout() {
    try {
      await API.post(CONFIG.ENDPOINTS.LOGOUT, {});
    } catch { /* ignore server errors on logout */ }
    setCurrentUser(null);
    Router.showAuthSection();
    UI.showToast('You have been signed out.', 'info');
  }

  /* ── Bind Event Listeners ─────────────────────────────── */
  function init() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Switch between login / register
    document.getElementById('go-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      Router.showAuthPage('register');
    });
    document.getElementById('go-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      Router.showAuthPage('login');
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input    = document.getElementById(targetId);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁' : '🙈';
      });
    });
  }

  return { init, getCurrentUser, setCurrentUser, restoreUser, isLoggedIn };
})();
