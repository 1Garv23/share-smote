import { useState } from 'react';
import PropTypes from 'prop-types';
import './Login.css';

/**
 * Login component for user authentication
 * @param {Object} props - Component props
 * @param {Function} props.setToken - Function to set authentication token
 * @param {Function} props.setView - Function to switch between login/register views
 */
function Login({ setToken, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and update state
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  /**
   * Switch to register view
   */
  const handleRegisterClick = () => {
    setView('register');
  };

  return (
    <div className="login-container">
      {/* Project title section */}
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

      {/* Login form section */}
      <div className="login-form-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
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
          {/* Display error message if present */}
          {error && <p style={errorStyles}>{error}</p>}
          <button type="submit" style={buttonStyles}>
            Login
          </button>
        </form>
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