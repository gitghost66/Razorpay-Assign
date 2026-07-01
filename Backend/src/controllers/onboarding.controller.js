'use strict';

const onboardingService = require('../services/onboarding.service');

/**
 * POST /rest/onboardings/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const data = await onboardingService.registerUser({ name, email, password });
    return res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /rest/onboardings/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const data = await onboardingService.loginUser({ email, password });

    req.session.userId = data.userId;
    req.session.role = data.role;

    req.session.save((err) => {
      if (err) return next(err);

      return res.status(200).json({
        status: "success",
        data,
      });
    });

  } catch (err) {
    next(err);
  }
}

/**
 * POST /rest/onboardings/logout
 */
async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ status: 'success', message: 'Logged out' });
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout };
