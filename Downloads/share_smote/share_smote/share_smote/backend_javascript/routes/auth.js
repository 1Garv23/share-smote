const express = require('express');
const receiveCredentials = require('./auth/receive-credentials');
const { validateRegister, validateLogin } = require('./auth/validate-input');
const createUser = require('./auth/create-user');
const verifyUser = require('./auth/verify-user');
const issueJwtToken = require('./auth/issue-jwt-token');
const { applyMiddleware } = require('./auth/applyMiddleware');
const { sendOTP } = require('./otp-helper/send-otp');
const verifyOTP = require('./otp-helper/verify-otp');

const router = express.Router();

router.post(
  '/register',
  receiveCredentials,
  validateRegister,
  createUser,
  issueJwtToken
);

router.post(
  '/login',
  receiveCredentials,
  validateLogin,
  verifyUser,
  issueJwtToken
);


router.post('/otp/send', sendOTP);

router.post(
  '/otp/verify',
  verifyOTP,
  issueJwtToken
);

router.get('/user', applyMiddleware, (req, res) => res.json(req.userSafe));

module.exports = router;