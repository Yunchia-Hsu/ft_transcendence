import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'ru' | 'zh';

type NavStrings = {
  enable2fa: string;
  logout: string;
  login: string;
  register: string;
  appName: string;
};

type AuthStrings = {
  titles: {
    login: string;
    register: string;
    twoFactor: string;
    enable2fa: string;
  };
  labels: {
    username: string;
    password: string;
    email: string;
    code: string;
    manualKey: string;
    loadingQR: string;
  };
  actions: {
    signIn: string;
    signingIn: string;
    createAccount: string;
    creatingAccount: string;
    verify: string;
    verifying: string;
    activate2fa: string;
  };
  links: {
    noAccount: string;
    register: string;
    haveAccount: string;
    login: string;
  };
  banners: {
    loginSuccess: string;
    registrationSuccess: string;
    twoFactorSuccess: string;
    twoFactorEnabled: string;
  };
  errors: {
    // Validation errors
    usernameMinLength: string;
    passwordMinLength: string;
    emailInvalid: string;
    // Auth errors
    invalidCredentials: string;
    userNotFound: string;
    emailTaken: string;
    usernameTaken: string;
    // Generic errors
    networkError: string;
    serverError: string;
    validationFailed: string;
  };
};

type GameStrings = {
  buttons: {
    start: string;
    stop: string;
  };
};

export type Translations = {
  nav: NavStrings;
  auth: AuthStrings;
  game: GameStrings;
};

const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    nav: {
      enable2fa: 'Enable 2FA',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      appName: 'Pong',
    },
    auth: {
      titles: {
        login: 'Login',
        register: 'Register',
        twoFactor: 'Two-Factor Verification',
        enable2fa: 'Enable Two-Factor Authentication',
      },
      labels: {
        username: 'Username',
        password: 'Password',
        email: 'Email',
        code: '6-digit code',
        manualKey: 'Manual key',
        loadingQR: 'Loading QR...',
      },
      actions: {
        signIn: 'Sign in',
        signingIn: 'Signing in...',
        createAccount: 'Create account',
        creatingAccount: 'Creating account...',
        verify: 'Verify',
        verifying: 'Verifying...',
        activate2fa: 'Activate 2FA',
      },
      links: {
        noAccount: 'No account?',
        register: 'Register',
        haveAccount: 'Have an account?',
        login: 'Login',
      },
      banners: {
        loginSuccess: 'Login successful.',
        registrationSuccess: 'Registration successful. Please log in.',
        twoFactorSuccess: 'Two-factor verification successful.',
        twoFactorEnabled: 'Two-factor authentication enabled',
      },
      errors: {
        usernameMinLength: 'Username must be at least 3 characters long',
        passwordMinLength: 'Password must be at least 6 characters long',
        emailInvalid: 'Please enter a valid email address',
        invalidCredentials: 'Invalid username or password',
        userNotFound: 'User not found',
        emailTaken: 'Email address is already registered',
        usernameTaken: 'Username is already taken',
        networkError: 'Network error. Please try again.',
        serverError: 'Server error. Please try again later.',
        validationFailed: 'Please check your input and try again',
      },
    },
    game: {
      buttons: {
        start: 'Start the Chaos!',
        stop: 'Stop the Madness!',
      },
    },
  },
  ru: {
    nav: {
      enable2fa: 'Включить 2FA',
      logout: 'Выход',
      login: 'Войти',
      register: 'Регистрация',
      appName: 'Понг',
    },
    auth: {
      titles: {
        login: 'Вход',
        register: 'Регистрация',
        twoFactor: 'Двухфакторная проверка',
        enable2fa: 'Включить двухфакторную аутентификацию',
      },
      labels: {
        username: 'Имя пользователя',
        password: 'Пароль',
        email: 'Эл. почта',
        code: '6-значный код',
        manualKey: 'Ручной ключ',
        loadingQR: 'Загрузка QR...',
      },
      actions: {
        signIn: 'Войти',
        signingIn: 'Вход...',
        createAccount: 'Создать аккаунт',
        creatingAccount: 'Создание аккаунта...',
        verify: 'Подтвердить',
        verifying: 'Проверка...',
        activate2fa: 'Активировать 2FA',
      },
      links: {
        noAccount: 'Нет аккаунта?',
        register: 'Зарегистрироваться',
        haveAccount: 'Уже есть аккаунт?',
        login: 'Войти',
      },
      banners: {
        loginSuccess: 'Вход выполнен успешно.',
        registrationSuccess: 'Регистрация прошла успешно. Пожалуйста, войдите.',
        twoFactorSuccess: 'Двухфакторная проверка успешна.',
        twoFactorEnabled: 'Двухфакторная аутентификация включена',
      },
      errors: {
        usernameMinLength: 'Имя пользователя должно быть не менее 3 символов',
        passwordMinLength: 'Пароль должен содержать не менее 6 символов',
        emailInvalid: 'Пожалуйста, введите действительный адрес электронной почты',
        invalidCredentials: 'Неверное имя пользователя или пароль',
        userNotFound: 'Пользователь не найден',
        emailTaken: 'Этот email уже зарегистрирован',
        usernameTaken: 'Это имя пользователя уже занято',
        networkError: 'Ошибка сети. Попробуйте еще раз.',
        serverError: 'Ошибка сервера. Попробуйте позже.',
        validationFailed: 'Проверьте введенные данные и попробуйте снова',
      },
    },
    game: {
      buttons: {
        start: 'Запустить хаос!',
        stop: 'Остановить безумие!',
      },
    },
  },
  zh: {
    nav: {
      enable2fa: '启用双重验证',
      logout: '退出登录',
      login: '登录',
      register: '注册',
      appName: '乒乓',
    },
    auth: {
      titles: {
        login: '登录',
        register: '注册',
        twoFactor: '双重验证',
        enable2fa: '启用双重验证',
      },
      labels: {
        username: '用户名',
        password: '密码',
        email: '邮箱',
        code: '6位验证码',
        manualKey: '手动密钥',
        loadingQR: '正在加载二维码...',
      },
      actions: {
        signIn: '登录',
        signingIn: '正在登录...',
        createAccount: '创建账户',
        creatingAccount: '正在创建账户...',
        verify: '验证',
        verifying: '正在验证...',
        activate2fa: '启用 2FA',
      },
      links: {
        noAccount: '没有账户？',
        register: '注册',
        haveAccount: '已有账户？',
        login: '登录',
      },
      banners: {
        loginSuccess: '登录成功。',
        registrationSuccess: '注册成功。请登录。',
        twoFactorSuccess: '双重验证成功。',
        twoFactorEnabled: '已启用双重验证',
      },
      errors: {
        usernameMinLength: '用户名至少需要3个字符',
        passwordMinLength: '密码至少需要6个字符',
        emailInvalid: '请输入有效的电子邮件地址',
        invalidCredentials: '用户名或密码无效',
        userNotFound: '用户未找到',
        emailTaken: '该邮箱已被注册',
        usernameTaken: '该用户名已被占用',
        networkError: '网络错误，请重试。',
        serverError: '服务器错误，请稍后重试。',
        validationFailed: '请检查您的输入并重试',
      },
    },
    game: {
      buttons: {
        start: '开始混战！',
        stop: '停止疯狂！',
      },
    },
  },
};

type TranslationsContextValue = {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: Translations;
};

const TranslationsContext = createContext<TranslationsContextValue | undefined>(undefined);

export function TranslationsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>(() => (localStorage.getItem('lang') as LanguageCode) || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const value = useMemo<TranslationsContextValue>(() => ({ lang, setLang, t }), [lang, t]);

  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>;
}

export function useLang(): TranslationsContextValue {
  const ctx = useContext(TranslationsContext);
  if (!ctx) throw new Error('useLang must be used within TranslationsProvider');
  return ctx;
}

export function useTranslations(): Translations {
  return useLang().t;
}

// Helper function to translate backend error messages
export function useErrorTranslator() {
  const { t } = useLang();
  
  return (backendMessage: string): string => {
    // Map common backend error patterns to translation keys
    const lowerMessage = backendMessage.toLowerCase();
    
    if (lowerMessage.includes('username') && lowerMessage.includes('3 characters')) {
      return t.auth.errors.usernameMinLength;
    }
    if (lowerMessage.includes('password') && lowerMessage.includes('6 characters')) {
      return t.auth.errors.passwordMinLength;
    }
    if (lowerMessage.includes('email') && lowerMessage.includes('valid')) {
      return t.auth.errors.emailInvalid;
    }
    if (lowerMessage.includes('invalid') && (lowerMessage.includes('credentials') || lowerMessage.includes('password'))) {
      return t.auth.errors.invalidCredentials;
    }
    if (lowerMessage.includes('user not found')) {
      return t.auth.errors.userNotFound;
    }
    if (lowerMessage.includes('email') && (lowerMessage.includes('taken') || lowerMessage.includes('exists'))) {
      return t.auth.errors.emailTaken;
    }
    if (lowerMessage.includes('username') && (lowerMessage.includes('taken') || lowerMessage.includes('exists'))) {
      return t.auth.errors.usernameTaken;
    }
    
    // Fallback to original message if no pattern matches
    return backendMessage;
  };
}


