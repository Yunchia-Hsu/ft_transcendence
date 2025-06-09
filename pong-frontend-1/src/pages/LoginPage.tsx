import React, { useContext } from 'react';
import useAuth from '../hooks/useAuth'; // Using the custom hook
import AuthForm from '../components/Auth/AuthForm';
import { useHistory } from 'react-router-dom'; // For redirection

const LoginPage: React.FC = () => {
  const { login } = useAuth(); // Use the custom hook
  const history = useHistory();

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      await login(credentials.username, credentials.password); // Pass username and password separately
      history.push('/main'); // Redirect to main page on successful login
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (e.g., show a message to the user)
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <AuthForm onSubmit={handleLogin} />
    </div>
  );
};

export default LoginPage;