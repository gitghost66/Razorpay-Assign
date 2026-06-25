'use strict';

const { Router } = require('express');
const rolesController = require('../controllers/roles.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const router = Router();

router.post('/assign', authenticate, requireRole('CFO'), rolesController.assignRole);

module.exports = router;
