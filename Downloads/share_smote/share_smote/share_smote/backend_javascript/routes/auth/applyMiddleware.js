const jwt = require('jsonwebtoken');
const User = require('../../models/User'); 

const HTTP_UNAUTHORIZED = 401;

async function applyMiddleware(req, res, next) {
  try {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;  //remove raw.slice(7)
    //do not use magic number 401
    if (!token) return res.status(HTTP_UNAUTHORIZED).json({ message: 'No token provided' });
    // console.log(token);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(HTTP_UNAUTHORIZED).json({ message: 'Invalid token' });
    req.userId = user._id;
    req.userSafe = user;
    next();
  } catch {
    return res.status(HTTP_UNAUTHORIZED).json({ message: 'Invalid token' });
  }
}

module.exports = { applyMiddleware };
