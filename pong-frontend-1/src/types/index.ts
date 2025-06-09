export interface User {
  id: string;
  username: string;
  email: string;
}

export type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export interface SettingsContextType {
  language: string;
  theme: 'light' | 'dark';
  setLanguage: (language: string) => void;
  toggleTheme: () => void;
}
