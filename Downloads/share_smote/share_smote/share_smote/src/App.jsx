import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
// import Dashboard from './components/Dashboard';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('login');
  };

  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {view === 'login' ? (
        <Login setToken={setToken} setView={setView} />
      ) : (
        <Register setToken={setToken} setView={setView} />
      )}
    </div>
  );
}

export default App;