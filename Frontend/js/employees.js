/**
 * employees.js
 * Handles the Employees view (RM, APE, CFO):
 *   - List employees (filtered by role on the backend)
 *   - Search / filter locally
 *   - CFO: assign / unassign employees to RMs
 *   - RM/CFO: click employee to see their reimbursements
 */

const Employees = (() => {

  let _allEmployees = []; // cached for search
  let _detailEmployee = null; // { userId, name, email }

  /* ─────────────────────────────────────────────────────────
     LOAD EMPLOYEES LIST
  ───────────────────────────────────────────────────────── */

  async function loadEmployees() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Customise subtitle by role
    const subtitles = {
      RM : 'Your direct reports',
      APE: 'All employees and reporting managers',
      CFO: 'All users (excluding CFO)',
    };
    document.getElementById('emp-subtitle').textContent = subtitles[user.role] || '';

    // Show assign/unassign panel only for CFO
    const assignPanel = document.getElementById('assign-panel');
    if (user.role === CONFIG.ROLES.CFO) {
      assignPanel.style.display = 'block';
    } else {
      assignPanel.style.display = 'none';
    }

    // Show "Actions" column header for RM/CFO (view detail)
    const actionsHeader = document.getElementById('emp-actions-th');
    if (['RM', 'CFO'].includes(user.role)) {
      actionsHeader.classList.remove('hidden');
    } else {
      actionsHeader.classList.add('hidden');
    }

    UI.showLoading('emp-loading', 'employees-table', 'employees-empty');

    try {
      const res   = await API.get(CONFIG.ENDPOINTS.EMPLOYEES);
      _allEmployees = res.data.users || [];
      renderEmployeesTable(_allEmployees, user.role);
    } catch (err) {
      UI.showTable('emp-loading', 'employees-table', 'employees-empty', false);
      UI.showToast(err.message, 'error');
    }
  }

  function renderEmployeesTable(employees, role) {
    const tbody = document.getElementById('employees-tbody');
    tbody.innerHTML = '';

    if (!employees.length) {
      UI.showTable('emp-loading', 'employees-table', 'employees-empty', false);
      return;
    }

    const canViewDetail = ['RM', 'CFO'].includes(role);

    employees.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${UI.escapeHtml(String(emp.userId))}</td>
        <td>${UI.escapeHtml(emp.name)}</td>
        <td>${UI.escapeHtml(emp.email)}</td>
        <td>${UI.roleBadge(emp.role)}</td>
        ${canViewDetail && emp.role === 'EMP' ? `
          <td>
            <button class="btn btn-ghost btn-sm view-claims-btn"
                    data-id="${emp.userId}"
                    data-name="${UI.escapeHtml(emp.name)}"
                    data-email="${UI.escapeHtml(emp.email)}">
              View Claims ${Icons.html('arrow')}
            </button>
          </td>
        ` : canViewDetail ? '<td>—</td>' : ''}
      `;
      tbody.appendChild(tr);
    });

    UI.animateRows(tbody);
    UI.showTable('emp-loading', 'employees-table', 'employees-empty', true);

    // Bind "View Claims" buttons
    tbody.querySelectorAll('.view-claims-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _detailEmployee = {
          userId: btn.dataset.id,
          name  : btn.dataset.name,
          email : btn.dataset.email,
        };
        Router.navigateTo('employee-detail');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     LOCAL SEARCH
  ───────────────────────────────────────────────────────── */

  function initSearch() {
    document.getElementById('emp-search').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        renderEmployeesTable(_allEmployees, Auth.getCurrentUser()?.role);
        return;
      }
      const filtered = _allEmployees.filter(emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        String(emp.userId).includes(q)
      );
      renderEmployeesTable(filtered, Auth.getCurrentUser()?.role);
    });
  }

  /* ─────────────────────────────────────────────────────────
     ASSIGN / UNASSIGN (CFO only)
  ───────────────────────────────────────────────────────── */

  async function handleAssign(action) {
    const empId = parseInt(document.getElementById('assign-emp-id').value, 10);
    const rmId  = parseInt(document.getElementById('assign-rm-id').value, 10);

    if (!empId || !rmId || isNaN(empId) || isNaN(rmId)) {
      UI.showToast('Please enter valid Employee ID and RM ID.', 'error');
      return;
    }

    const btnId = action === 'assign' ? 'assign-btn' : 'unassign-btn';
    UI.setButtonLoading(btnId, true);

    try {
      if (action === 'assign') {
        await API.post(CONFIG.ENDPOINTS.EMPLOYEES_ASSIGN, { empId, rmId });
        UI.showToast(`Employee ${empId} assigned to RM ${rmId}.`, 'success');
      } else {
        await API.del(CONFIG.ENDPOINTS.EMPLOYEES_ASSIGN, { empId, rmId });
        UI.showToast(`Employee ${empId} unassigned from RM ${rmId}.`, 'success');
      }
      // Clear inputs and refresh list
      document.getElementById('assign-emp-id').value = '';
      document.getElementById('assign-rm-id').value  = '';
      loadEmployees();
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading(btnId, false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     EMPLOYEE DETAIL — reimbursements for a specific EMP
     Route: GET /rest/reimbursements/:userId
  ───────────────────────────────────────────────────────── */

  async function loadEmployeeDetail() {
    if (!_detailEmployee) {
      Router.navigateTo('employees');
      return;
    }

    document.getElementById('detail-emp-name').textContent  = _detailEmployee.name + "'s Claims";
    document.getElementById('detail-emp-email').textContent = _detailEmployee.email;

    UI.showLoading('detail-loading', 'detail-table', 'detail-empty');

    try {
      const res    = await API.get(`${CONFIG.ENDPOINTS.REIMBURSEMENTS}/${_detailEmployee.userId}`);
      const claims = res.data.reimbursements || [];
      renderDetailTable(claims);
    } catch (err) {
      UI.showTable('detail-loading', 'detail-table', 'detail-empty', false);
      UI.showToast(err.message, 'error');
    }
  }

  function renderDetailTable(claims) {
    const tbody = document.getElementById('detail-tbody');
    tbody.innerHTML = '';

    if (!claims.length) {
      UI.showTable('detail-loading', 'detail-table', 'detail-empty', false);
      return;
    }

    claims.forEach(claim => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td title="${UI.escapeHtml(claim.title)}">${UI.escapeHtml(truncate(claim.title, 40))}</td>
        <td title="${UI.escapeHtml(claim.description)}">${UI.escapeHtml(truncate(claim.description, 60))}</td>
        <td>${UI.formatAmount(claim.amount)}</td>
        <td>${UI.statusBadge(claim.status)}</td>
      `;
      tbody.appendChild(tr);
    });

    UI.animateRows(tbody);
    UI.showTable('detail-loading', 'detail-table', 'detail-empty', true);
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  function init() {
    document.getElementById('refresh-employees-btn')
      .addEventListener('click', loadEmployees);

    document.getElementById('assign-btn')
      .addEventListener('click', () => handleAssign('assign'));

    document.getElementById('unassign-btn')
      .addEventListener('click', () => handleAssign('unassign'));

    document.getElementById('back-from-detail-btn')
      .addEventListener('click', () => Router.navigateTo('employees'));

    initSearch();
  }

  /* Helpers */
  function truncate(str, len) {
    return str && str.length > len ? str.slice(0, len) + '…' : (str || '');
  }

  return { init, loadEmployees, loadEmployeeDetail };
})();
