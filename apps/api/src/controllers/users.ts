import { saveUserToDatabase, checkUserExists, getUserByUsername } from '../../../../packages/infra/db/index.js';
import { DatabaseUser } from "../../../../packages/infra/db/index.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

let nextId = 1;
export function generateUserId() {
  return String(nextId++); 
}

export const registerUser = async (data: { username: string; email: string; password: string }) => {
  const { username, email, password } = data;
  
  // check if user has registered
  const userExists = await checkUserExists(username, email);
  if (userExists) {
    throw new Error('User with this username or email already exists');
  }

  // encrypt password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  
  // created unique id 
  const userId = generateUserId(); 
  
  const newUser: DatabaseUser = {
    userid: userId,
    username,
    displayname: null,
    email,
    password: hashedPassword,
    isEmailVerified: false,
    createdAt: new Date().toISOString(),
    avatar: null,
    status: "offline",
  };
  
  // save data to data base
  await saveUserToDatabase(newUser);
  
  // 回傳時不包含密碼
  return {
    userId: newUser.userId,
    username: newUser.username,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
};



// 🔧 實際使用 password - 例如驗證密碼
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

export const getUserProfile = async (username: string): Promise<DatabaseUser | null> => {
  const user: DatabaseUser = {                         
    username: username, 
    displayname: "Best pong player",                
    email: "player1@example.com",
    password: "hashedPassword123",         
    isEmailVerified: true,                    
    avatar: "https://example.com/avatar1.jpg", 
    status: "online",
  };                          
  return user;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const { username, email } = data;
  return { userId, username, email };
};

export const deleteUserProfile = async (userId: string) => {
  return { message: "User profile deleted successfully" };
};

export const getCurrentUser = async (username: string) => {
  try {
    
    const user: DatabaseUser | null = await getUserProfile(username);
    
    if (!user) {
      return null;
    }

    return {
      id: user.userid,
      username: user.username,
      displayname: user.displayname,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      status: user.status || 'offline',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('Failed to get user information');
  }
};
