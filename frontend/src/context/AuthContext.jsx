import React, { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loadUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) return null; // not logged in or token invalid
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      // swallow network errors here; caller can decide what to do
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
