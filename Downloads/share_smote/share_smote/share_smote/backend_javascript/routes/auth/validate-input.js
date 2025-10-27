const HTTP_BAD_REQUEST = 400;

function validateRegister(req, res, next) {
  const { username, email, password } = req.creds || {};
  if (!username || !email || !password) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'Missing fields' });
  }
  next();
}
function validateLogin(req, res, next) {
  const { email, password } = req.creds || {};
  if (!email || !password) {
    return res.status(HTTP_BAD_REQUEST).json({ message: 'Missing fields' });
  }
  next();
}
module.exports = { validateRegister, validateLogin };
