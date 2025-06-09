import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthContextType as AuthContextTypeFromTypes } from '../types'; // Import User and the correct AuthContextType

// Create the context with a default value
const AuthContext = createContext<AuthContextTypeFromTypes | undefined>(undefined);

// Export the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    // Hardcoded admin user check
    if (username === 'root' && password === '123') {
      setIsAuthenticated(true);
      setUser({ id: 'admin-001', username: 'root', email: 'root@example.com' });
      // In a real app, you'd get a token and user details from the backend
      console.log('Admin logged in');
      return Promise.resolve();
    }
    // Placeholder for actual API call if needed later, or error for now
    console.error('Invalid credentials');
    return Promise.reject(new Error('Invalid credentials'));
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    // In a real app, you'd call the backend to invalidate the session/token
    console.log('User logged out');
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook to use the context (no change needed here if it uses the imported type or infers correctly)
// If useAuth directly uses useContext(AuthContext), it will get the correct type.
// The useAuth hook in src/hooks/useAuth.ts already imports AuthContext from here.

// Export the Context object itself if still needed, though the hook is preferred.
export { AuthContext };