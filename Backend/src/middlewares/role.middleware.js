'use strict';

/**
 * role.middleware.js
 * Factory function that returns a middleware which checks whether
 * req.user.role is in the list of allowed roles.
 * Returns 403 if the role is not permitted.
 *
 * Usage: requireRole('CFO', 'APE')
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to perform this action.',
      });
    }
    next();
  };
}

module.exports = { requireRole };
