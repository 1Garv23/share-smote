const User = require('../../models/User');
const { otpStore } = require('./send-otp');

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Check if OTP exists for this email
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid, delete it from store
    otpStore.delete(email);

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with OTP login
      user = new User({
        email,
        username: email.split('@')[0], // Use email prefix as username
        password: 'otp_login_' + Date.now() // Placeholder password for OTP users
      });
      await user.save();
    }

    // Attach user to request for JWT generation
    req.user = user;
    next();

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP',
      error: error.message 
    });
  }
};

module.exports = verifyOTP;