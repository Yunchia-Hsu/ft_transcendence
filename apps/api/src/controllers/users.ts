export const registerUser = async (data: any) => {
  const { username, email, password } = data;
  const newUser = { userId: "123", username, email };
  return newUser;
};

export const loginUser = async (data: any) => {
  const { username, password } = data;
  const token = "generated-jwt-token";
  return { token, userId: "123" };
};

export const getAllUsers = async () => {
  const users = [
    { userId: "123", username: "Player1", email: "player1@example.com" },
    { userId: "124", username: "Player2", email: "player2@example.com" },
  ];
  return users;
};

export const getUserProfile = async (userId: string) => {
  const user = { userId, username: "Player1", email: "player1@example.com" };
  return user;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const { username, email } = data;
  return { userId, username, email };
};

export const deleteUserProfile = async (userId: string) => {
  return { message: "User profile deleted successfully" };
};

export async function refreshToken(input: { refreshToken: string }) {
  // TODO: check refreshToken valid or expired
  // TODO: check accessToken、may need a new refreshToken
  return {
    accessToken: 'new.jwt.here',
    refreshToken: 'new.refresh.token',
  };
}

export async function logoutUser(input: { refreshToken: string }) {
  // TODO: add refreshToken to block list or delete from dashboard
  return { message: 'Logged out' };
}

export async function getMe(userId: string) {
 
  return { userId, username: 'demo', email: 'demo@pong.dev' };
}

export async function verifyEmail(input: {
  userId: string;
  code: string;
}) {
 
  const success = true;
  return { verified: success };
}

export async function enable2FA(input: { userId: string; totp: string }) {
 
  return { enabled: true };
}

/*
你現在的 controller 檔如何「就地升級」

把每個 TODO/假資料 依序替換：

registerUser：查重 → argon2.hash() → repo.create() → 回「淨化過的使用者」。

loginUser：repo.findByUsernameOrEmail() → argon2.verify() → jwt.sign()。

refreshToken：檢查 refreshToken 白/黑名單 → 簽新 accessToken（必要時也換 refresh）。

logoutUser：把 refreshToken 加入黑名單或刪除。

updateUserProfile：比對 c.get('userId') 或 admin → repo.update() → 409/404 正確回應。

deleteUserProfile：同上權限 → repo.remove()。

getMe / getUserProfile：查 DB → 回安全欄位。

verifyEmail / enable2FA：與 Redis/DB/OTP 驗證邏輯串起來。
*/