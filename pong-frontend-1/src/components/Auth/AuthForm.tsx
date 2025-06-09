import React, { useState } from 'react';

interface AuthFormProps {
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // Assuming you might add a register toggle

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        // For now, we only care about login for the hardcoded user
        if (isLogin) {
            await onSubmit({ username, password });
        } else {
            // Handle registration logic if you add it
            alert('Registration not implemented yet.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <div>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
                Switch to {isLogin ? 'Register' : 'Login'}
            </button>
        </form>
    );
};

export default AuthForm;