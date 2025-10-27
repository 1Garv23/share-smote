import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching and managing user data
 * Fetches user information on mount and handles authentication
 * @param {string} token - JWT authentication token
 * @param {Function} onLogout - Callback function to handle logout on auth failure
 * @returns {Object} User data state
 * @returns {Object|null} returns.user - User object containing username and email
 * @returns {boolean} returns.loading - Whether user data is being fetched
 */
export const useUserData = (token, onLogout) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches user data from the API
     * Logs out user if authentication fails
     * @async
     */
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Authentication failed, trigger logout
          onLogout();
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, onLogout]);

  return { user, loading };
};