'use strict';

const employeesService = require('../services/employees.service');

/**
 * GET /rest/employees
 * Allowed: RM, APE, CFO
 */
async function getEmployees(req, res, next) {
  try {
    const { userId, role } = req.user;
    const users = await employeesService.getEmployees({ userId, role });
    return res.status(200).json({ status: 'success', data: { users } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /rest/employees/assign
 * Allowed: CFO only
 */
async function assignEmployee(req, res, next) {
  try {
    const { empId, rmId } = req.body;
    await employeesService.assignEmployee({ empId, rmId });
    return res.status(200).json({ status: 'success', message: 'Assigned' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /rest/employees/assign
 * Allowed: CFO only
 */
async function unassignEmployee(req, res, next) {
  try {
    const { empId, rmId } = req.body;
    await employeesService.unassignEmployee({ empId, rmId });
    return res.status(200).json({ status: 'success', message: 'Unassigned' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEmployees, assignEmployee, unassignEmployee };
