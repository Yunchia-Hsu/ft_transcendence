export type LanguageCode = 'en' | 'ru' | 'zh';

export type NavStrings = {
  enable2fa: string;
  logout: string;
  login: string;
  register: string;
  appName: string;
  profile: string;
  friends: string;
  quickPlay: string;
  tournaments: string;
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
  mainMenu: {
    title: string;
    playWithYourself: string;
    playWithAI: string;
    tournaments: string;
    starting: string;
    savingResult: string;
    startNewGame: string;
  };
  quickPlay: {
    title: string;
    description: string;
    findOpponent: string;
    joining: string;
    searching: string;
    cancel: string;
    waitingForOpponent: string;
    failedToCheckStatus: string;
  };
  tournaments: {
    title: string;
    createNew: string;
    name: string;
    size: string;
    creating: string;
    create: string;
    loading: string;
    noTournaments: string;
    status: string;
    rounds: string;
    refresh: string;
    nicknameOptional: string;
    join: string;
    leave: string;
    start: string;
  };
  onlineUsers: {
    title: string;
    loading: string;
    failedToLoad: string;
    nobodyOnline: string;
    online: string;
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

export type FriendsStrings = {
  title: string;
  tabs: {
    friends: string;
    requests: string;
    sent: string;
    search: string;
  };
  actions: {
    accept: string;
    decline: string;
    remove: string;
    cancel: string;
    addFriend: string;
    search: string;
    searching: string;
  };
  messages: {
    requestSent: string;
    requestAccepted: string;
    requestRejected: string;
    requestCancelled: string;
    friendRemoved: string;
    sendRequestFailed: string;
    acceptRequestFailed: string;
    rejectRequestFailed: string;
    cancelRequestFailed: string;
    removeFriendFailed: string;
    searchFailed: string;
  };
  placeholders: {
    searchUsers: string;
  };
  empty: {
    noFriends: {
      title: string;
      description: string;
    };
    noPendingRequests: {
      title: string;
      description: string;
    };
    noSentRequests: {
      title: string;
      description: string;
    };
    noSearchResults: {
      title: string;
      description: string;
    };
    searchPrompt: {
      title: string;
      description: string;
    };
  };
  confirmations: {
    removeFriend: string;
    cancelRequest: string;
  };
  status: {
    friends: string;
    pending: string;
    friendsSince: string;
    wantsToBeFriend: string;
    requestSent: string;
  };
};

export type Translations = {
  nav: NavStrings;
  auth: AuthStrings;
  game: GameStrings;
  profile: ProfileStrings;
  friends: FriendsStrings;
};
