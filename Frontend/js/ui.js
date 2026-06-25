/**
 * ui.js
 * Shared UI utility functions used across modules:
 * - Toast notifications
 * - Button loading states
 * - Field error display
 * - Status badges
 * - Modal
 * - Sidebar population
 * - Amount formatting
 */

const UI = (() => {

  /* ── Toast Notifications ─────────────────────────────── */
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    const dismiss = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 300); // safety fallback
    };
    const timer = setTimeout(dismiss, CONFIG.TOAST_DURATION);
    toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
  }

  /* ── Button Loading State ────────────────────────────── */
  function setButtonLoading(btnId, loading) {
    const btn     = document.getElementById(btnId);
    if (!btn) return;
    const txtEl   = btn.querySelector('.btn-text');
    const spinEl  = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (loading) {
      txtEl?.classList.add('hidden');
      spinEl?.classList.remove('hidden');
    } else {
      txtEl?.classList.remove('hidden');
      spinEl?.classList.add('hidden');
    }
  }

  /* ── Field Validation Errors ─────────────────────────── */
  function setFieldError(errorElId, message) {
    const el = document.getElementById(errorElId);
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.add('visible');
      // mark input invalid
      const inputId = errorElId.replace('-error', '');
      document.getElementById(inputId)?.classList.add('error');
    } else {
      el.textContent = '';
      el.classList.remove('visible');
      const inputId = errorElId.replace('-error', '');
      document.getElementById(inputId)?.classList.remove('error');
    }
  }

  function clearFieldErrors(...errorElIds) {
    errorElIds.forEach(id => setFieldError(id, null));
  }

  /* ── Status Badge HTML ───────────────────────────────── */
  function statusBadge(status) {
    const map = {
      PENDING : { cls: 'badge-pending',  icon: '⏳', label: 'Pending'  },
      APPROVED: { cls: 'badge-approved', icon: '✔',  label: 'Approved' },
      REJECTED: { cls: 'badge-rejected', icon: '✕',  label: 'Rejected' },
    };
    const info = map[status] || { cls: '', icon: '', label: status };
    return `<span class="badge ${info.cls}">${info.icon} ${info.label}</span>`;
  }

  /** Role badge HTML */
  function roleBadge(role) {
    const cls = { EMP:'badge-emp', RM:'badge-rm', APE:'badge-ape', CFO:'badge-cfo' }[role] || '';
    return `<span class="badge ${cls}">${role}</span>`;
  }

  /* ── Currency format ─────────────────────────────────── */
  function formatAmount(amount) {
    return '₹ ' + Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /* ── XSS-safe HTML escape ────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Show / hide a loading skeleton ─────────────────── */
  function showLoading(loadingId, tableId, emptyId) {
    document.getElementById(loadingId)?.classList.remove('hidden');
    document.getElementById(tableId)?.classList.add('hidden');
    document.getElementById(emptyId)?.classList.add('hidden');
  }

  function showTable(loadingId, tableId, emptyId, hasRows) {
    document.getElementById(loadingId)?.classList.add('hidden');
    if (hasRows) {
      document.getElementById(tableId)?.classList.remove('hidden');
      document.getElementById(emptyId)?.classList.add('hidden');
    } else {
      document.getElementById(tableId)?.classList.add('hidden');
      document.getElementById(emptyId)?.classList.remove('hidden');
    }
  }

  /* ── Modal ───────────────────────────────────────────── */
  let _modalResolve = null;

  /**
   * Show a confirm modal.
   * @returns {Promise<boolean>} true = confirmed, false = cancelled
   */
  function showModal({ title, body, confirmText = 'Confirm', confirmClass = 'btn-primary' }) {
    return new Promise((resolve) => {
      _modalResolve = resolve;
      document.getElementById('modal-title').textContent        = title;
      document.getElementById('modal-body').textContent         = body;
      document.getElementById('modal-confirm-text').textContent = confirmText;

      const confirmBtn = document.getElementById('modal-confirm-btn');
      confirmBtn.className = `btn ${confirmClass}`;
      confirmBtn.innerHTML = `
        <span class="btn-text" id="modal-confirm-text">${escapeHtml(confirmText)}</span>
        <span class="btn-spinner hidden"></span>
      `;

      document.getElementById('action-modal').classList.remove('hidden');
    });
  }

  function hideModal() {
    document.getElementById('action-modal').classList.add('hidden');
    if (_modalResolve) { _modalResolve(false); _modalResolve = null; }
  }

  function initModal() {
    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      if (_modalResolve) { _modalResolve(false); _modalResolve = null; }
      hideModal();
    });
    document.getElementById('modal-confirm-btn').addEventListener('click', () => {
      if (_modalResolve) { _modalResolve(true); _modalResolve = null; }
      // don't auto-hide — caller handles it
    });
    document.getElementById('action-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) hideModal();
    });
  }

  /* ── Sidebar user info ───────────────────────────────── */
  function updateSidebarUser(user) {
    if (!user) return;
    const initials = user.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    document.getElementById('user-avatar-initials').textContent   = initials;
    document.getElementById('mobile-user-avatar').textContent     = initials;
    document.getElementById('sidebar-user-name').textContent      = user.name;
    document.getElementById('sidebar-user-role').textContent      = user.role;
    document.getElementById('sidebar-user-role').className =
      `user-role-badge badge-${user.role.toLowerCase()}`;
  }

  /* ── Build Nav based on role ─────────────────────────── */
  function buildNav(role) {
    const navList = document.getElementById('nav-list');
    navList.innerHTML = '';

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['EMP', 'RM', 'APE', 'CFO'] },
      { id: 'submit-claim', label: 'Submit Claim', icon: '📝', roles: ['EMP'] },
      { id: 'review', label: 'Review Claims', icon: '🔍', roles: ['RM', 'APE', 'CFO'] },
      { id: 'employees', label: 'Employees', icon: '👥', roles: ['RM', 'APE', 'CFO'] },
      { id: 'roles', label: 'Role Management', icon: '🛡', roles: ['CFO'] },
    ];

    navItems
      .filter(item => item.roles.includes(role))
      .forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.dataset.view = item.id;
        li.style.animationDelay = `${index * 50}ms`;
        li.innerHTML = `
          <button id="nav-${item.id}" aria-label="Navigate to ${item.label}">
            <span class="nav-icon">${item.icon}</span>
            ${escapeHtml(item.label)}
          </button>
        `;
        li.querySelector('button').addEventListener('click', () => {
          Router.navigateTo(item.id);
        });
        navList.appendChild(li);
      });
  }

  function setActiveNav(viewId) {
    document.querySelectorAll('.nav-item').forEach(li => {
      li.classList.toggle('active', li.dataset.view === viewId);
    });
  }

  /* ── Animate table rows ──────────────────────────────── */
  function animateRows(tbody) {
    Array.from(tbody.children).forEach((row, i) => {
      row.classList.add('row-animate');
      row.style.animationDelay = `${i * 40}ms`;
    });
  }

  return {
    showToast,
    setButtonLoading,
    setFieldError,
    clearFieldErrors,
    statusBadge,
    roleBadge,
    formatAmount,
    escapeHtml,
    showLoading,
    showTable,
    showModal,
    hideModal,
    initModal,
    updateSidebarUser,
    buildNav,
    setActiveNav,
    animateRows,
  };
})();
