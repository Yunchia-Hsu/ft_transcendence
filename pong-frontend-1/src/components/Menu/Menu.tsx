import React from 'react';
import useAuth from '../../hooks/useAuth';
import useSettings from '../../hooks/useSettings';
import LanguageSelector from './LanguageSelector';
import ThemeToggler from './ThemeToggler';
import { useHistory } from 'react-router-dom'; // For redirection

const Menu: React.FC = () => {
  const { logout, isAuthenticated } = useAuth(); // Get isAuthenticated for conditional rendering if needed
  const { language } = useSettings(); // Removed setLanguage as it's handled by LanguageSelector
  const history = useHistory();

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      await logout();
      console.log('Logout successful, redirecting...');
      history.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout failed in Menu:', error);
    }
  };

  // Only show menu if authenticated, or handle this logic in App.tsx routing
  if (!isAuthenticated) {
    return null; // Or a message, or rely on routing to redirect
  }

  return (
    <div className="menu">
      <p>Welcome!</p> {/* Or user's name: user?.username */}
      <LanguageSelector />
      <ThemeToggler />
      <button onClick={handleLogout}>Logout</button>
      <p>Current Language: {language}</p>
      <p>Current Auth State: {isAuthenticated ? "Logged In" : "Logged Out"}</p>
    </div>
  );
};

export default Menu;