import type { Translations } from '../types';

export const zh: Translations = {
  nav: {
    enable2fa: '启用双重验证',
    logout: '退出登录',
    login: '登录',
    register: '注册',
    appName: '乒乓',
    profile: '个人资料',
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
  profile: {
    title: '个人资料设置',
    labels: {
      username: '用户名',
      displayName: '显示名称',
      avatar: '头像',
      avatarUrl: '头像链接',
      email: '电子邮箱',
    },
    actions: {
      save: '保存更改',
      saving: '保存中...',
      cancel: '取消',
      edit: '编辑',
    },
    messages: {
      saveSuccess: '个人资料更新成功',
      saveError: '个人资料更新失败',
    },
    placeholders: {
      noAvatarUrl: '未设置头像链接',
      notSet: '未设置',
      avatarUrlInput: 'https://example.com/avatar.jpg',
      displayNameInput: '输入显示名称（可选）',
    },
  },
};
