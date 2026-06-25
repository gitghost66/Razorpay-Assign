'use strict';

const { Router } = require('express');
const reimbursementsController = require('../controllers/reimbursements.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

// POST /rest/reimbursements — EMP only: submit a new claim
router.post(
  '/',
  authenticate,
  requireRole('EMP'),
  reimbursementsController.createReimbursement
);

// PATCH /rest/reimbursements — RM, APE, CFO: approve or reject
router.patch(
  '/',
  authenticate,
  requireRole('RM', 'APE', 'CFO'),
  reimbursementsController.updateReimbursement
);

// GET /rest/reimbursements — all authenticated roles, visibility filtered by service
router.get(
  '/',
  authenticate,
  reimbursementsController.getReimbursements
);

// GET /rest/reimbursements/:userId — RM (for their subs), CFO (any EMP)
router.get(
  '/:userId',
  authenticate,
  requireRole('RM', 'CFO'),
  reimbursementsController.getReimbursementsByEmployee
);

module.exports = router;
