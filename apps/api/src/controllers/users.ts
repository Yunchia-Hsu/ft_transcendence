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