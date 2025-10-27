const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const HTTP_BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;
module.exports = async function verifyUser(req, res, next) {
  try {
    const { email, password } = req.creds;
    const user = await User.findOne({ email }); 
    if (!user) return res.status(HTTP_BAD_REQUEST).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(HTTP_BAD_REQUEST).json({ message: 'Invalid credentials' });
    req.authUser = user; 
    next();
  } catch (e) {
    console.error('Login error:', e);
    res.status(INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
  }
};
