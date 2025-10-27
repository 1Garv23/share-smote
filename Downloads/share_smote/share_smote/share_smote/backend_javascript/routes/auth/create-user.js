const bcrypt = require('bcryptjs');
const User = require('../../models/User');

const HTTP_BAD_REQUEST = 400;
const BCRYPT_SALT_ROUNDS = 10;

module.exports = async function createUser(req, res, next) {
  try {
    const { username, email, password } = req.creds;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(HTTP_BAD_REQUEST).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ username, email, password: hashed });
    await user.save();
    req.authUser = user; 
    next();
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
