import { saveUserToDatabase, checkUserExists, getUserByUsername, getUserById  } from '../../../../packages/infra/db/index.js';
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
  
  // 回傳時不包含密碼
  return {
    userId: newUser.userid,
    username: newUser.username,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
};



// // 🔧 實際使用 password - 例如驗證密碼
// export const loginUser = async (data: { email: string; password: string }) => {
//   const { email, password } = data;
//   //驗證用戶是否存在
//   if (!email){
//     throw new Error('not a valid user');
//   } 

  
  // //驗證用戶是否存在
  // if (!(await bcrypt.compare(password, data.password))){
  //   throw new Error('invalid password');
  //   }
  // }
// //驗證用戶是否存在
//   const token = jwt.sign({email, username: user.username }, key);
//   console.log('token: ', token);
//   //驗證用戶是否存在
//   res.send({
//     message: 'log in successfully!!!',
//     token
//   })
//   return { token, userId: "123" };
// };  



// export const loginUser = async (data: { email: string; password: string }) => {
//   const { email, password } = data;
  
//   // 1. 驗證用戶是否存在
//   const user = await getUserByUsername(email);
//   if (!user) {
//     throw new Error('Invalid credentials');
//   }
  
//   // 2. 驗證密碼是否正確
//   const isValidPassword = await bcrypt.compare(password, user.password);
//   if (!isValidPassword) {
//     throw new Error('Invalid credentials');
//   }
  
//   // 3. 生成 JWT token
//   const token = jwt.sign(
//     { 
//       email, 
//       username: user.username 
//     },
//     process.env.JWT_SECRET || 'your-secret-key',
//     { expiresIn: '24h' }
//   );
//const JWT_SECRET = process.env.JWT_SECRET!;

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
  
  // const token = jwt.sign(
  //   { 
  //     userId: user.userid,  // 建議使用 userId 而非 email
  //     username: user.username,
  //     email: user.email
  //   },
  //   process.env.JWT_SECRET || 'your-secret-key',
  //   { expiresIn: '48h' }invalid signature
  // );
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
  



export const getAllUsers = async () => {
  const users = [
    { userId: "123", username: "Player1", email: "player1@example.com" },
    { userId: "124", username: "Player2", email: "player2@example.com" },
  ];
  return users;
};



export const getUserProfile = async (userid: string): Promise<DatabaseUser | null> => {
  // 從資料庫撈一筆
  const row = await getUserById (userid);
  if (!row) return null;

  // 如果你想明確映射（也可直接 return row）
  const user: DatabaseUser = {
    userid: row.userid,
    username: row.username,
    displayname: row.displayname,               // string | null
    email: row.email,
    password: row.password,                     // bcrypt 雜湊，/me 不要回傳
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
