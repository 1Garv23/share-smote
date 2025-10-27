import { useState } from 'react';
import PropTypes from 'prop-types';

function Register({ setToken, setView }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const inputStyles = {
    width: '100%',
    padding: '8px',
  };

  const buttonStyles = {
    width: '100%',
    padding: '10px',
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

  const textStyles = {
    color: 'black',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
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

  const handleLoginClick = () => {
    setView('login');
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyles}
          />
        </div>
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
          Register
        </button>
      </form>
      <p>
        <span style={textStyles}>Already have an account? </span>
        <button
          type="button"
          onClick={handleLoginClick}
          style={linkButtonStyles}
        >
          Login
        </button>
      </p>
    </div>
  );
}

Register.propTypes = {
  setToken: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
};

export default Register;