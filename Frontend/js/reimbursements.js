/**
 * reimbursements.js
 * Handles all reimbursement-related UI and API logic:
 *   - Dashboard view (My Reimbursements)
 *   - Submit Claim form (EMP)
 *   - Review Claims table (RM, APE, CFO)
 */

const Reimbursements = (() => {

  /* ─────────────────────────────────────────────────────────
     DASHBOARD — "My Reimbursements"
     Visible to ALL roles (each sees role-filtered data).
  ───────────────────────────────────────────────────────── */

  async function loadDashboard() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Customise header text by role
    const titles = {
      EMP : ['My Reimbursements',    'Track your submitted expense claims'],
      RM  : ["Team's Pending Claims", 'Reimbursements from your direct reports'],
      APE : ['Claims for APE Review', 'Reimbursements awaiting accounts review'],
      CFO : ['All Approved Claims',   'Full pipeline visibility'],
    };
    const [title, sub] = titles[user.role] || titles.EMP;
    document.getElementById('dashboard-title').textContent    = title;
    document.getElementById('dashboard-subtitle').textContent = sub;

    // Show "New Claim" button only to EMP
    const newClaimBtn = document.getElementById('new-claim-btn');
    if (user.role === CONFIG.ROLES.EMP) {
      newClaimBtn.classList.remove('hidden');
      newClaimBtn.onclick = () => Router.navigateTo('submit-claim');
    } else {
      newClaimBtn.classList.add('hidden');
    }

    UI.showLoading('reimb-loading', 'reimbursements-table', 'reimbursements-empty');

    try {
      const res    = await API.get(CONFIG.ENDPOINTS.REIMBURSEMENTS);
      const claims = res.data.reimbursements || [];

      renderStatsRow(claims, user.role);
      renderReimbursementsTable(claims, user.role);
    } catch (err) {
      UI.showTable('reimb-loading', 'reimbursements-table', 'reimbursements-empty', false);
      UI.showToast(err.message, 'error');
    }
  }

  function renderStatsRow(claims, role) {
    const statsRow = document.getElementById('stats-row');
    const total    = claims.length;
    const pending  = claims.filter(c => c.status === 'PENDING').length;
    const approved = claims.filter(c => c.status === 'APPROVED').length;
    const rejected = claims.filter(c => c.status === 'REJECTED').length;
    const totalAmt = claims.reduce((sum, c) => sum + Number(c.amount), 0);

    statsRow.innerHTML = `
      <div class="stat-card slide-up stagger-1">
        <span class="stat-label">Total Claims</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat-card slide-up stagger-2">
        <span class="stat-label">Pending</span>
        <span class="stat-value" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${pending}</span>
      </div>
      <div class="stat-card slide-up stagger-3">
        <span class="stat-label">Approved</span>
        <span class="stat-value" style="background:linear-gradient(135deg,#22c55e,#4ade80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${approved}</span>
      </div>
      <div class="stat-card slide-up stagger-4">
        <span class="stat-label">Total Value</span>
        <span class="stat-value" style="font-size:1.5rem;">${UI.formatAmount(totalAmt)}</span>
      </div>
    `;
  }

  function renderReimbursementsTable(claims, role) {
    const thead = document.getElementById('reimbursements-thead-row');
    const tbody = document.getElementById('reimbursements-tbody');

    // Build table headers — RM/CFO get an "Actions" column
    const showActions = ['RM', 'APE', 'CFO'].includes(role);
    thead.innerHTML = `
      <th>Title</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Status</th>
      ${showActions ? '<th>Actions</th>' : ''}
    `;

    tbody.innerHTML = '';

    if (!claims.length) {
      UI.showTable('reimb-loading', 'reimbursements-table', 'reimbursements-empty', false);
      return;
    }

    claims.forEach(claim => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td title="${UI.escapeHtml(claim.title)}">${UI.escapeHtml(truncate(claim.title, 40))}</td>
        <td title="${UI.escapeHtml(claim.description)}">${UI.escapeHtml(truncate(claim.description, 60))}</td>
        <td>${UI.formatAmount(claim.amount)}</td>
        <td>${UI.statusBadge(claim.status)}</td>
        ${showActions && claim.status === 'PENDING' ? `
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-success btn-sm approve-btn" data-id="${claim.reimbursementId || claim.id || ''}">Approve</button>
              <button class="btn btn-danger btn-sm reject-btn"  data-id="${claim.reimbursementId || claim.id || ''}">Reject</button>
            </div>
          </td>
        ` : showActions ? '<td>—</td>' : ''}
      `;
      tbody.appendChild(tr);
    });

    UI.animateRows(tbody);
    UI.showTable('reimb-loading', 'reimbursements-table', 'reimbursements-empty', true);

    // Bind approve / reject buttons (RM, APE, CFO dashboard)
    tbody.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        handleUpdateReimbursement(btn.dataset.id, 'APPROVED', btn);
      });
    });
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        handleUpdateReimbursement(btn.dataset.id, 'REJECTED', btn);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     REVIEW CLAIMS — RM / APE / CFO
  ───────────────────────────────────────────────────────── */

  async function loadReview() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const subtitles = {
      RM : 'Reimbursements from your direct reports needing your approval',
      APE: 'Reimbursements that have been RM-approved, awaiting accounts review',
      CFO: 'All reimbursements — you have full approve / reject authority',
    };
    document.getElementById('review-subtitle').textContent = subtitles[user.role] || '';

    UI.showLoading('review-loading', 'review-table', 'review-empty');

    try {
      const res    = await API.get(CONFIG.ENDPOINTS.REIMBURSEMENTS);
      const claims = res.data.reimbursements || [];
      renderReviewTable(claims);
    } catch (err) {
      UI.showTable('review-loading', 'review-table', 'review-empty', false);
      UI.showToast(err.message, 'error');
    }
  }

  function renderReviewTable(claims) {
    const tbody = document.getElementById('review-tbody');
    tbody.innerHTML = '';

    if (!claims.length) {
      UI.showTable('review-loading', 'review-table', 'review-empty', false);
      return;
    }

    // NOTE: The backend GET /rest/reimbursements returns title/description/amount/status
    // only — the `id` is not included in the response. We show an input for the reviewer
    // to enter the reimbursement ID manually when approving/rejecting.
    claims.forEach((claim, idx) => {
      const tr = document.createElement('tr');
      const rid = claim.reimbursementId || claim.id || '';
      const inputId = `rid-input-${idx}`;
      tr.innerHTML = `
        <td title="${UI.escapeHtml(claim.title)}">${UI.escapeHtml(truncate(claim.title, 40))}</td>
        <td title="${UI.escapeHtml(claim.description)}">${UI.escapeHtml(truncate(claim.description, 60))}</td>
        <td>${UI.formatAmount(claim.amount)}</td>
        <td>${UI.statusBadge(claim.status)}</td>
        <td>
          <div style="display:flex;flex-direction:column;gap:6px;min-width:180px;">
            ${rid
              ? `<span style="font-size:0.75rem;color:var(--clr-text-muted);">ID: #${UI.escapeHtml(String(rid))}</span>`
              : `<div style="display:flex;align-items:center;gap:4px;">
                   <input id="${inputId}" type="number" class="form-input form-input-sm" placeholder="Claim ID" style="width:90px;" title="Enter the reimbursement ID" />
                 </div>`
            }
            <div style="display:flex;gap:6px;">
              <button class="btn btn-success btn-sm review-approve-btn"
                      data-id="${rid}"
                      data-input-id="${inputId}"
                      title="Approve this claim">✔ Approve</button>
              <button class="btn btn-danger btn-sm review-reject-btn"
                      data-id="${rid}"
                      data-input-id="${inputId}"
                      title="Reject this claim">✕ Reject</button>
            </div>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    UI.animateRows(tbody);
    UI.showTable('review-loading', 'review-table', 'review-empty', true);

    // Bind approve / reject buttons
    tbody.querySelectorAll('.review-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id || document.getElementById(btn.dataset.inputId)?.value;
        handleUpdateReimbursement(id, 'APPROVED', btn);
      });
    });
    tbody.querySelectorAll('.review-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id || document.getElementById(btn.dataset.inputId)?.value;
        handleUpdateReimbursement(id, 'REJECTED', btn);
      });
    });
  }

  async function handleUpdateReimbursement(reimbursementId, status, triggerBtn) {
    if (!reimbursementId) {
      UI.showToast('Cannot determine claim ID.', 'error');
      return;
    }

    const confirmed = await UI.showModal({
      title      : status === 'APPROVED' ? 'Approve Claim' : 'Reject Claim',
      body       : `Are you sure you want to ${status.toLowerCase()} this reimbursement request?`,
      confirmText: status === 'APPROVED' ? 'Yes, Approve' : 'Yes, Reject',
      confirmClass: status === 'APPROVED' ? 'btn-success' : 'btn-danger',
    });

    if (!confirmed) { UI.hideModal(); return; }

    UI.setButtonLoading('modal-confirm-btn', true);

    try {
      await API.patch(CONFIG.ENDPOINTS.REIMBURSEMENTS, {
        reimbursementId: Number(reimbursementId),
        status,
      });
      UI.hideModal();
      UI.showToast(
        `Claim ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
        status === 'APPROVED' ? 'success' : 'info'
      );
      // Refresh the active view
      const activeView = Router.getActiveView();
      if (activeView === 'review')    loadReview();
      if (activeView === 'dashboard') loadDashboard();
    } catch (err) {
      UI.hideModal();
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading('modal-confirm-btn', false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     SUBMIT CLAIM — EMP only
  ───────────────────────────────────────────────────────── */

  async function handleSubmitClaim(e) {
    e.preventDefault();

    const title       = document.getElementById('claim-title').value.trim();
    const description = document.getElementById('claim-description').value.trim();
    const amountRaw   = document.getElementById('claim-amount').value.trim();
    const amount      = parseFloat(amountRaw);

    // Client-side validation
    UI.setFieldError('claim-title-error',       title       ? null : 'Title is required.');
    UI.setFieldError('claim-description-error', description ? null : 'Description is required.');

    let amountErr = null;
    if (!amountRaw)       amountErr = 'Amount is required.';
    else if (isNaN(amount) || amount <= 0) amountErr = 'Amount must be a positive number.';
    UI.setFieldError('claim-amount-error', amountErr);

    if (!title || !description || amountErr) return;

    UI.setButtonLoading('submit-claim-btn', true);

    try {
      await API.post(CONFIG.ENDPOINTS.REIMBURSEMENTS, { title, description, amount });
      UI.showToast('Claim submitted successfully!', 'success');
      document.getElementById('claim-form').reset();
      Router.navigateTo('dashboard');
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading('submit-claim-btn', false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  function init() {
    document.getElementById('claim-form')
      .addEventListener('submit', handleSubmitClaim);

    document.getElementById('cancel-claim-btn')
      .addEventListener('click', () => Router.navigateTo('dashboard'));

    document.getElementById('refresh-reimbursements-btn')
      .addEventListener('click', loadDashboard);

    document.getElementById('refresh-review-btn')
      .addEventListener('click', loadReview);
  }

  /* ─────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────── */
  function truncate(str, len) {
    return str && str.length > len ? str.slice(0, len) + '…' : (str || '');
  }

  return { init, loadDashboard, loadReview };
})();
