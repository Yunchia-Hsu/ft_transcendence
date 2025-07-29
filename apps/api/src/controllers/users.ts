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
