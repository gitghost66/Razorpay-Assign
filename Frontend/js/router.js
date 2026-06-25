/**
 * router.js
 * Simple SPA router — switches between views inside the app shell.
 * Also controls showing auth vs app sections.
 */

const Router = (() => {

  let _activeView = null;

  /* ── All defined view IDs ──────────────────────────────── */
  const ALL_VIEWS = [
    'dashboard',
    'submit-claim',
    'review',
    'employees',
    'employee-detail',
    'roles',
  ];

  /* ── Role permissions for each view ─────────────────────── */
  const VIEW_ROLES = {
    'dashboard'      : ['EMP', 'RM', 'APE', 'CFO'],
    'submit-claim'   : ['EMP'],
    'review'         : ['RM', 'APE', 'CFO'],
    'employees'      : ['RM', 'APE', 'CFO'],
    'employee-detail': ['RM', 'CFO'],
    'roles'          : ['CFO'],
  };

  /* ── View → loader function mapping ─────────────────────── */
  const LOADERS = {
    'dashboard'      : () => Reimbursements.loadDashboard(),
    'submit-claim'   : () => { /* form — no load needed */ },
    'review'         : () => Reimbursements.loadReview(),
    'employees'      : () => Employees.loadEmployees(),
    'employee-detail': () => Employees.loadEmployeeDetail(),
    'roles'          : () => { /* form — no load needed */ },
  };

  /* ── Navigate to a view ──────────────────────────────────── */
  function navigateTo(viewId) {
    const user = Auth.getCurrentUser();
    if (!user) {
      showAuthSection();
      return;
    }

    // Guard: check role permission
    const allowed = VIEW_ROLES[viewId] || [];
    if (!allowed.includes(user.role)) {
      UI.showToast('You do not have permission to access this page.', 'error');
      navigateTo('dashboard');
      return;
    }

    _activeView = viewId;

    // Hide all views, show the target
    ALL_VIEWS.forEach(id => {
      const el = document.getElementById(`view-${id}`);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('view-entering');
      // Remove class after animation
      target.addEventListener('animationend', () => {
        target.classList.remove('view-entering');
      }, { once: true });
    }

    // Update active nav item
    UI.setActiveNav(viewId);

    // Close mobile sidebar
    closeSidebar();

    // Hide result card on roles page when navigating away
    if (viewId !== 'roles') {
      const rc = document.getElementById('role-result-card');
      if (rc) rc.style.display = 'none';
    }

    // Call loader if defined
    if (LOADERS[viewId]) {
      LOADERS[viewId]();
    }
  }

  function getActiveView() { return _activeView; }

  /* ── Auth section ────────────────────────────────────────── */
  function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
    showAuthPage('login');
  }

  function showAppSection(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    UI.updateSidebarUser(user);
    UI.buildNav(user.role);
    navigateTo('dashboard');
  }

  function showAuthPage(pageId) {
    // pageId: 'login' | 'register'
    document.getElementById('page-login').classList.toggle('hidden', pageId !== 'login');
    document.getElementById('page-register').classList.toggle('hidden', pageId !== 'register');
  }

  /* ── Mobile sidebar ──────────────────────────────────────── */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id        = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay active';
      overlay.addEventListener('click', closeSidebar);
      document.body.appendChild(overlay);
    } else {
      overlay.classList.add('active');
    }
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    document.getElementById('sidebar-open-btn')
      .addEventListener('click', openSidebar);
    document.getElementById('sidebar-close-btn')
      .addEventListener('click', closeSidebar);
  }

  return {
    init,
    navigateTo,
    getActiveView,
    showAuthSection,
    showAppSection,
    showAuthPage,
  };
})();
