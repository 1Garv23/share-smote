const jwt = require('jsonwebtoken');

const JWT_EXPIRES_IN = '7d';
const HTTP_CREATED = 201;
const HTTP_OK = 200;

module.exports = function issueJwtToken(req, res) {
  const currentUser = req.authUser;
  const token = jwt.sign({ id: currentUser._id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const status = req.method === 'POST' && req.path.endsWith('register') ? HTTP_CREATED : HTTP_OK;
  return res.status(status).json({
    token,
    user: { id: currentUser._id, username: currentUser.username, email: currentUser.email },
  });
};
