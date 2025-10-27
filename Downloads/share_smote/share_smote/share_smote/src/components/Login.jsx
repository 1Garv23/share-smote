import { useState } from 'react';
import PropTypes from 'prop-types';
import './Login.css';

function Login({ setToken, setView }) {
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const inputStyles = {
    width: '100%',
    padding: '8px',
    color: 'black', 
    backgroundColor: 'white', 
    border: '1px solid #ccc', 
    borderRadius: '4px',
  };

  const buttonStyles = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const linkButtonStyles = {
    background: 'none',
    border: 'none',
    color: 'blue',
    cursor: 'pointer',
  };

  const errorStyles = {
    color: 'red',
  };

  const successStyles = {
    color: '#28a745',
    fontSize: '14px',
    marginTop: '10px',
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setSuccessMessage('OTP sent successfully! Check your email.');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setView('register');
  };

  const toggleLoginMode = () => {
    setLoginMode(loginMode === 'password' ? 'otp' : 'password');
    setEmail('');
    setPassword('');
    setOtp('');
    setOtpSent(false);
    setError('');
    setSuccessMessage('');
  };

  const handleResendOTP = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="login-container">
      {/* Title Page Section */}
      <div className="title-page">
        <h1 className="course-code">SOFTWARE ENGINEERING (IT303)</h1>
        <h2 className="course-project">
          COURSE PROJECT TITLE: "Augmentation of RGB Image Dataset using SMOTE"
        </h2>

        <div className="title-divider" />

        <p className="carried-out">Carried out by</p>
        <p className="student-name">Anshul Dadhich (231IT010)</p>
        <p className="student-name">Garv Mandloi (231IT023)</p>
        <p className="student-name">H S Jayanth (231IT024)</p>
      </div>

      {/* Login Form Section */}
      <div className="login-form-container">
        <h2>{loginMode === 'password' ? 'Login' : 'Login with OTP'}</h2>
        
        {loginMode === 'password' ? (
          /* Password Login Form */
          <form onSubmit={handlePasswordLogin}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyles}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyles}
              />
            </div>
            {error && <p style={errorStyles}>{error}</p>}
            <button type="submit" style={buttonStyles}>
              Login
            </button>
          </form>
        ) : (
          /* OTP Login Form */
          !otpSent ? (
            <form onSubmit={handleSendOTP}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyles}
                  disabled={loading}
                />
              </div>
              
              {error && <p style={errorStyles}>{error}</p>}
              {successMessage && <p style={successStyles}>{successMessage}</p>}
              
              <button 
                type="submit" 
                style={buttonStyles}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  disabled
                  style={{ ...inputStyles, backgroundColor: '#e9ecef' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength="6"
                  style={inputStyles}
                  disabled={loading}
                  className="otp-input"
                />
              </div>
              
              {error && <p style={errorStyles}>{error}</p>}
              
              <button 
                type="submit" 
                style={buttonStyles}
                disabled={loading || otp.length !== 6}
                className={loading || otp.length !== 6 ? 'button-disabled' : ''}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <p className="resend-otp-text">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  style={linkButtonStyles}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )
        )}

        {/* Toggle between login modes */}
        <p className="toggle-login-mode">
          <button
            type="button"
            onClick={toggleLoginMode}
            className="toggle-mode-button"
          >
            {loginMode === 'password' ? '🔐 Login with OTP instead' : '🔑 Login with Password instead'}
          </button>
        </p>

        {/* Register link */}
        <p>
          Don&apos;t have an account?
          {' '}
          <button
            type="button"
            onClick={handleRegisterClick}
            style={linkButtonStyles}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
};

export default Login;