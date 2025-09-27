import type { Translations } from '../types';

export const ru: Translations = {
  nav: {
    enable2fa: 'Включить 2FA',
    logout: 'Выход',
    login: 'Войти',
    register: 'Регистрация',
    appName: 'Понг',
    profile: 'Профиль',
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
  profile: {
    title: 'Настройки профиля',
    labels: {
      username: 'Имя пользователя',
      displayName: 'Отображаемое имя',
      avatar: 'Аватар',
      avatarUrl: 'URL аватара',
      email: 'Электронная почта',
    },
    actions: {
      save: 'Сохранить изменения',
      saving: 'Сохранение...',
      cancel: 'Отмена',
      edit: 'Редактировать',
    },
    messages: {
      saveSuccess: 'Профиль успешно обновлен',
      saveError: 'Не удалось обновить профиль',
    },
    placeholders: {
      noAvatarUrl: 'URL аватара не установлен',
      notSet: 'Не установлено',
      avatarUrlInput: 'https://example.com/avatar.jpg',
      displayNameInput: 'Введите отображаемое имя (необязательно)',
    },
  },
};
