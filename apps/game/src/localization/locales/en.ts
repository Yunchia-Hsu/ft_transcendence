import type { Translations } from '../types';

export const en: Translations = {
  nav: {
    enable2fa: 'Enable 2FA',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    appName: 'Pong',
    profile: 'Profile',
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
  profile: {
    title: 'Profile Settings',
    labels: {
      username: 'Username',
      displayName: 'Display Name',
      avatar: 'Avatar',
      avatarUrl: 'Avatar URL',
      email: 'Email',
    },
    actions: {
      save: 'Save Changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      edit: 'Edit',
    },
    messages: {
      saveSuccess: 'Profile updated successfully',
      saveError: 'Failed to update profile',
    },
    placeholders: {
      noAvatarUrl: 'No avatar URL set',
      notSet: 'Not set',
      avatarUrlInput: 'https://example.com/avatar.jpg',
      displayNameInput: 'Enter display name (optional)',
    },
  },
};
