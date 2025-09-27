import type { Translations } from '../types';

export const zh: Translations = {
  nav: {
    enable2fa: '啟用雙重驗證',
    logout: '退出登錄',
    login: '登錄',
    register: '註冊',
    appName: '乒乓',
    profile: '個人資料',
  },
  auth: {
    titles: {
      login: '登錄',
      register: '註冊',
      twoFactor: '雙重驗證',
      enable2fa: '啟用雙重驗證',
    },
    labels: {
      username: '用戶名',
      password: '密碼',
      email: '郵箱',
      code: '6位驗證碼',
      manualKey: '手動密鑰',
      loadingQR: '正在加載二維碼...',
    },
    actions: {
      signIn: '登錄',
      signingIn: '正在登錄...',
      createAccount: '創建賬戶',
      creatingAccount: '正在創建賬戶...',
      verify: '驗證',
      verifying: '正在驗證...',
      activate2fa: '啟用 2FA',
    },
    links: {
      noAccount: '沒有賬戶？',
      register: '註冊',
      haveAccount: '已有賬戶？',
      login: '登錄',
    },
    banners: {
      loginSuccess: '登錄成功。',
      registrationSuccess: '註冊成功。請登錄。',
      twoFactorSuccess: '雙重驗證成功。',
      twoFactorEnabled: '已啟用雙重驗證',
    },
    errors: {
      usernameMinLength: '用戶名至少需要3個字符',
      passwordMinLength: '密碼至少需要6個字符',
      emailInvalid: '請輸入有效的電子郵件地址',
      invalidCredentials: '用戶名或密碼無效',
      userNotFound: '用戶未找到',
      emailTaken: '該郵箱已被註冊',
      usernameTaken: '該用戶名已被佔用',
      networkError: '網絡錯誤，請重試。',
      serverError: '服務器錯誤，請稍後重試。',
      validationFailed: '請檢查您的輸入並重試',
    },
  },
  game: {
    buttons: {
      start: '開始混戰！',
      stop: '停止瘋狂！',
    },
  },
  profile: {
    title: '個人資料設置',
    labels: {
      username: '用戶名',
      displayName: '顯示名稱',
      avatar: '頭像',
      avatarUrl: '頭像鏈接',
      email: '電子郵箱',
    },
    actions: {
      save: '保存更改',
      saving: '保存中...',
      cancel: '取消',
      edit: '編輯',
    },
    messages: {
      saveSuccess: '個人資料更新成功',
      saveError: '個人資料更新失敗',
    },
    placeholders: {
      noAvatarUrl: '未設置頭像鏈接',
      notSet: '未設置',
      avatarUrlInput: 'https://example.com/avatar.jpg',
      displayNameInput: '輸入顯示名稱（可選）',
    },
  },
};
