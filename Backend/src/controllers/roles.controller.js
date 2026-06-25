'use strict';

const rolesService = require('../services/roles.service');

/**
 * POST /rest/roles/assign
 * Allowed: CFO only
 */
async function assignRole(req, res, next) {
  try {
    const { userId, role } = req.body;
    const data = await rolesService.assignRole({ userId, role });
    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

module.exports = { assignRole };
