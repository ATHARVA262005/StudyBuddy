import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://studybuddybackendd.vercel.app/api/check-auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      
      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
      setError('Failed to verify authentication status');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('https://studybuddybackendd.vercel.app/api/clear-auth', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setIsAuthenticated(false);
      localStorage.removeItem('hashedApiKey');
      localStorage.removeItem('apiKeyConfigured');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      error, 
      setIsAuthenticated,
      checkAuthStatus,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
