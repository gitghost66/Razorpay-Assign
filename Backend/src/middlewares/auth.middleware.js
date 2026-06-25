'use strict';

/**
 * auth.middleware.js
 * Reads the session cookie and attaches req.user = { userId, role }.
 * Returns 401 if no valid session exists.
 */
function authenticate(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Please log in to continue.',
    });
  }

  req.user = {
    userId: req.session.userId,
    role: req.session.role,
  };

  next();
}

module.exports = { authenticate };
