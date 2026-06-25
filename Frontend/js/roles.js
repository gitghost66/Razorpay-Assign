/**
 * roles.js
 * Handles the Role Management view (CFO only):
 *   POST /rest/roles/assign  — assign a role to any user
 */

const Roles = (() => {

  async function handleAssignRole(e) {
    e.preventDefault();

    const userId = document.getElementById('role-user-id').value.trim();
    const role   = document.getElementById('role-select').value;

    // Validation
    const userIdErr = (!userId || isNaN(Number(userId)) || Number(userId) <= 0)
      ? 'Please enter a valid numeric user ID.'
      : null;
    const roleErr = !role ? 'Please select a role.' : null;

    UI.setFieldError('role-user-id-error', userIdErr);
    UI.setFieldError('role-select-error',  roleErr);

    if (userIdErr || roleErr) return;

    UI.setButtonLoading('assign-role-btn', true);

    try {
      const res = await API.post(CONFIG.ENDPOINTS.ROLES_ASSIGN, {
        userId: Number(userId),
        role,
      });

      UI.showToast(`Role "${role}" assigned to user #${res.data.userId}.`, 'success');

      // Show result card
      const resultCard = document.getElementById('role-result-card');
      const resultContent = document.getElementById('role-result-content');
      resultCard.style.display = 'block';
      resultContent.innerHTML = `
        <div class="result-label">User ID</div>
        <div class="result-value">#${UI.escapeHtml(String(res.data.userId))}</div>
        <div style="margin: 0 8px; color: var(--clr-text-muted);">→</div>
        <div class="result-label">New Role</div>
        <div class="result-value">${UI.roleBadge(res.data.role)}</div>
      `;
      resultCard.classList.add('slide-up');

      // Reset form
      document.getElementById('role-form').reset();
      UI.setFieldError('role-user-id-error', null);
      UI.setFieldError('role-select-error',  null);
    } catch (err) {
      UI.showToast(err.message, 'error');
    } finally {
      UI.setButtonLoading('assign-role-btn', false);
    }
  }

  function init() {
    document.getElementById('role-form')
      .addEventListener('submit', handleAssignRole);
  }

  return { init };
})();
