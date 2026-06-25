'use strict';

const reimbursementsService = require('../services/reimbursements.service');

/**
 * POST /rest/reimbursements
 * Allowed: EMP only
 */
async function createReimbursement(req, res, next) {
  try {
    const { title, description, amount } = req.body;
    const empId = req.user.userId;

    const data = await reimbursementsService.createReimbursement({
      empId,
      title,
      description,
      amount,
    });

    return res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /rest/reimbursements
 * Allowed: RM, APE, CFO
 */
async function updateReimbursement(req, res, next) {
  try {
    const { reimbursementId, status } = req.body;
    const { userId, role } = req.user;

    const data = await reimbursementsService.updateReimbursementStatus({
      reimbursementId,
      status,
      userId,
      role,
    });

    return res.status(200).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /rest/reimbursements
 * All roles have different visibility
 */
async function getReimbursements(req, res, next) {
  try {
    const { userId, role } = req.user;
    const reimbursements = await reimbursementsService.getReimbursements({ userId, role });
    return res.status(200).json({ status: 'success', data: { reimbursements } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /rest/reimbursements/:userId
 * Allowed: RM (for their subordinates), CFO (any EMP)
 */
async function getReimbursementsByEmployee(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { userId: requesterId, role: requesterRole } = req.user;

    if (isNaN(targetUserId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid userId parameter.',
      });
    }

    const reimbursements = await reimbursementsService.getReimbursementsByEmployee({
      targetUserId,
      requesterId,
      requesterRole,
    });

    return res.status(200).json({ status: 'success', data: { reimbursements } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReimbursement,
  updateReimbursement,
  getReimbursements,
  getReimbursementsByEmployee,
};
