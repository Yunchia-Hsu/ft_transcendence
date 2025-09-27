export type LanguageCode = 'en' | 'ru' | 'zh';

export type NavStrings = {
  enable2fa: string;
  logout: string;
  login: string;
  register: string;
  appName: string;
  profile: string;
};

export type AuthStrings = {
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

export type GameStrings = {
  buttons: {
    start: string;
    stop: string;
  };
};

export type ProfileStrings = {
  title: string;
  labels: {
    username: string;
    displayName: string;
    avatar: string;
    avatarUrl: string;
    email: string;
  };
  actions: {
    save: string;
    saving: string;
    cancel: string;
    edit: string;
  };
  messages: {
    saveSuccess: string;
    saveError: string;
  };
  placeholders: {
    noAvatarUrl: string;
    notSet: string;
    avatarUrlInput: string;
    displayNameInput: string;
  };
};

export type Translations = {
  nav: NavStrings;
  auth: AuthStrings;
  game: GameStrings;
  profile: ProfileStrings;
};
