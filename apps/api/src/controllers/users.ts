import { saveUserToDatabase, checkUserExists, getUserByUsername, getUserById, db  } from '../../../../packages/infra/db/index.js';
import { DatabaseUser } from "../../../../packages/infra/db/index.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_SECRET } from '../config/jwt.js';

let nextId = 1;
const generateUserId = (): string => {
  return randomUUID();
};

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
  
  // no password
  return {
    userId: newUser.userid,
    username: newUser.username,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
};



export const loginUser = async (data: { username: string; password: string }) => {
  const { username, password } = data;
  
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
 let jwtsecret = 'secret';
const token = jwt.sign(
  { userId: user.userid, username: user.username, email: user.email },
  jwtsecret,
  { algorithm: 'HS256', expiresIn: '48h' }
);
  console.log('token from login:', token);
  return { 
    token, 
    userId: user.userid 
  };
};
  



export const getAllUsers = async (): Promise<Partial<DatabaseUser>[]> => {
  const users = await db
    .selectFrom("users")
    .select([
      "userid",
      "username",
      "email",
      "displayname",
      "isEmailVerified",
      "createdAt",
      "avatar",
      "status",
    ])
    .execute();
  return users;
};



export const getUserProfile = async (userid: string): Promise<DatabaseUser | null> => {
 
  const row = await getUserById (userid);
  if (!row) return null;

 
  const user: DatabaseUser = {
    userid: row.userid,
    username: row.username,
    displayname: row.displayname,               // string | null
    email: row.email,
    password: row.password,                     // bcrypt 
    isEmailVerified: !!row.isEmailVerified,     // 確保是 boolean
    createdAt: row.createdAt,
    avatar: row.avatar,                         // string | null
    status: row.status ?? 'offline',
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

export const getCurrentUser = async (userid: string) => {
  try {
    
    const user: DatabaseUser | null = await getUserProfile(userid);
    
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
