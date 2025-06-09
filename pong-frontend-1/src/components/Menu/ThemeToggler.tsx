import React from 'react';
import useSettings from '../../hooks/useSettings';

const ThemeToggler: React.FC = () => {
  const { theme, toggleTheme } = useSettings();

  const handleToggle = () => {
    console.log('Theme toggle clicked. Current theme:', theme);
    toggleTheme();
  };

  return (
    <button onClick={handleToggle} className="theme-toggle">
      Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
    </button>
  );
};

export default ThemeToggler;