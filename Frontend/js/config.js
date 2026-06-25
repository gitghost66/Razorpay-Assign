/**
 * config.js
 * Central configuration for the frontend.
 * Change API_BASE_URL to match your running backend.
 */

const CONFIG = {
  // Backend base URL (no trailing slash)
  API_BASE_URL: 'http://localhost:7002',

  // API endpoints
  ENDPOINTS: {
    REGISTER  : '/rest/onboardings/register',
    LOGIN     : '/rest/onboardings/login',
    LOGOUT    : '/rest/onboardings/logout',

    ROLES_ASSIGN      : '/rest/roles/assign',

    EMPLOYEES         : '/rest/employees',
    EMPLOYEES_ASSIGN  : '/rest/employees/assign',

    REIMBURSEMENTS    : '/rest/reimbursements',
  },

  // Valid roles
  ROLES: {
    EMP : 'EMP',
    RM  : 'RM',
    APE : 'APE',
    CFO : 'CFO',
  },

  // Toast display duration in ms
  TOAST_DURATION: 4000,
};

// Freeze to prevent accidental mutation
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.ROLES);
