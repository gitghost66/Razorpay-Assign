'use strict';

const { Router } = require('express');
const onboardingController = require('../controllers/onboarding.controller');

const router = Router();

router.post('/register', onboardingController.register);
router.post('/login', onboardingController.login);
router.post('/logout', onboardingController.logout);

module.exports = router;
