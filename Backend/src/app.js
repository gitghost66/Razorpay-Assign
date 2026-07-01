'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Route modules
const onboardingRoutes = require('./routes/onboarding.routes');
const rolesRoutes = require('./routes/roles.routes');
const employeesRoutes = require('./routes/employees.routes');
const reimbursementsRoutes = require('./routes/reimbursements.routes');

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    // CORS_ORIGIN must be set to the exact frontend URL in Render's dashboard.
    // The `|| true` fallback allows all origins when the env var is missing,
    // preventing CORS from blocking the preflight and causing "Cannot reach the server".
    // NOTE: `origin: undefined` (no fallback) makes cors send NO header → browser blocks fetch().
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Session ──────────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_dev_secret_change_in_prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // sameSite:'none' + secure:true are REQUIRED for cross-origin cookie delivery.
      // Browsers silently discard Set-Cookie headers that omit these attributes
      // when the frontend and backend are on different domains (e.g. Render subdomains).
      sameSite: 'none',
      secure: true,
      maxAge: Number(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24h
    },
  })
);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "RBAC Reimbursements API is running!"
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/rest/onboardings', onboardingRoutes);
app.use('/rest/roles', rolesRoutes);
app.use('/rest/employees', employeesRoutes);
app.use('/rest/reimbursements', reimbursementsRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Central Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected server error occurred.'
      : err.message;

  if (statusCode === 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
  });
});

module.exports = app;
