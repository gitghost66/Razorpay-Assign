'use strict';

const { Router } = require('express');
const employeesController = require('../controllers/employees.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

// GET /rest/employees — RM, APE, CFO can view
router.get(
  '/',
  authenticate,
  requireRole('RM', 'APE', 'CFO'),
  employeesController.getEmployees
);

// POST /rest/employees/assign — CFO only
router.post(
  '/assign',
  authenticate,
  requireRole('CFO'),
  employeesController.assignEmployee
);

// DELETE /rest/employees/assign — CFO only
router.delete(
  '/assign',
  authenticate,
  requireRole('CFO'),
  employeesController.unassignEmployee
);

module.exports = router;
