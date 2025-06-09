import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import './App.css';
import './index.css';

const ThemeApplicator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useSettings();

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ThemeApplicator>
            <div className="app">
              <Switch>
                <Route path="/login" component={LoginPage} />
                {/* Use ProtectedRoute for /main */}
                <ProtectedRoute path="/main" component={MainPage} />
                <Redirect from="/" to="/login" exact />
                {/* You might want a 404 page for unmatched routes */}
                {/* <Route path="*" component={NotFoundPage} /> */}
              </Switch>
            </div>
          </ThemeApplicator>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;