module.exports = function receiveCredentials(req, _res, next) {
  const { username, email, password } = req.body || {};
  req.creds = { username, email, password };
  next();
};
