'use strict';

require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 7002;

app.listen(PORT, () => {
  console.log(`[SERVER] Razorpay Reimbursements API running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
});
