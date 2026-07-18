'use strict';

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const session      = require('express-session');
const pgSession    = require('connect-pg-simple')(session);
const pool         = require('./db/index');

// Route modules
const onboardingRoutes     = require('./routes/onboarding.routes');
const rolesRoutes          = require('./routes/roles.routes');
const employeesRoutes      = require('./routes/employees.routes');
const reimbursementsRoutes = require('./routes/reimbursements.routes');

const app = express();

// ── Security headers & compression ──────────────────────────────────────────
app.use(helmet());
app.use(compression());

// ── Trust Proxy ──────────────────────────────────────────────────────────────
// Render (and most PaaS platforms) terminate TLS at a load balancer and forward
// requests to the app over plain HTTP, setting X-Forwarded-Proto: https.
// Without this, Express sees req.secure = false and SILENTLY drops every
// Set-Cookie header that has the Secure flag — meaning the session cookie is
// never sent to the browser even though login succeeds.
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
// credentials: true requires an explicit origin (not a wildcard '*').
// CORS_ORIGIN must be set to the exact deployed frontend URL in Render's dashboard.
// The `|| true` fallback (allow-any) is used only when the env var is absent,
// preventing a hard CORS block during development or if the var is missing.
app.use(
  cors({
    origin     : process.env.CORS_ORIGIN || true,
    credentials: true,
    methods    : ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ──────────────────────────────────────────────────────────────────
// connect-pg-simple stores sessions in the PostgreSQL database so they survive
// Render restarts and are shared across multiple instances.
//
// Cookie requirements for cross-origin (frontend ≠ backend domain):
//   sameSite: 'none'  — required for cross-site cookie delivery in all browsers
//   secure  : true    — required whenever sameSite is 'none' (browser enforced)
//   httpOnly: true    — prevents JavaScript from reading the cookie (XSS protection)
//
// These only work correctly because `trust proxy: 1` is set above; without it
// Express would see the connection as HTTP and drop the Secure cookie silently.
app.use(
  session({
    store : new pgSession({
      pool,                      // reuse the existing pg pool
      tableName: 'user_sessions', // auto-created on first request if it doesn't exist
      createTableIfMissing: true,
    }),
    secret           : process.env.SESSION_SECRET || 'fallback_dev_secret_change_in_prod',
    resave           : false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'none',
      secure  : true,
      maxAge  : Number(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 h
    },
  })
);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status : 'success',
    message: 'RBAC Reimbursements API is running!',
  });
});

// ── Rate limiting ────────────────────────────────────────────────────────────
// Credential-stuffing / brute-force protection on login & registration only —
// every other route already requires an authenticated session.
const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit   : 10,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { status: 'error', message: 'Too many attempts. Please try again later.' },
});
app.use(['/rest/onboardings/login', '/rest/onboardings/register'], authRateLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/rest/onboardings',    onboardingRoutes);
app.use('/rest/roles',          rolesRoutes);
app.use('/rest/employees',      employeesRoutes);
app.use('/rest/reimbursements', reimbursementsRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status : 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Central Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    =
    statusCode === 500
      ? 'An unexpected server error occurred.'
      : err.message;

  if (statusCode === 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({ status: 'error', message });
});

module.exports = app;
