import { saveUserToDatabase, checkUserExists, getUserByUsername, getUserById, db  } from '../../../../packages/infra/db/index.js';
import { DatabaseUser } from "../../../../packages/infra/db/index.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JWT_SECRET } from '../config/jwt.js';
import { Statement } from 'sqlite3';
import speakeasy from 'speakeasy' ;
import QRCode from 'qrcode';
import type { Friends } from "../../../../packages/infra/db/index.js";
import { success } from 'zod';


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
    twoFactorSecret: null,
    twoFactorEnabled: 0,//false
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
  
 
// 檢查是否啟用 2FA
if (user.twoFactorEnabled) {
  // create temp token
  const tempToken = jwt.sign(
    { userId: user.userid, temp: true },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
  
  return {
    requireTwoFactor: true,
    tempToken: tempToken
  };
} else {
  // 直接登入
  const token = jwt.sign(
    { userId: user.userid, username: user.username },
    JWT_SECRET,
    { expiresIn: '36h' }
  );
  
  return { token, userId: user.userid };
}
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
    isEmailVerified: !!row.isEmailVerified,     // boolean
    createdAt: row.createdAt,
    avatar: row.avatar,                         // string | null
    status: row.status ?? 'offline',
    twoFactorSecret: row.twoFactorSecret || null, // string | null
  
    twoFactorEnabled: Number (!!row.twoFactorEnabled),
  };
                       
  return user;
};

export const updateUserProfile = async (userId: string, data: { username: string; displayname: string | null; avatar?: string | null }) => {
  try {
    const { username, displayname, avatar } = data;
    
    // Prepare update data
    const updateData: { username: string; displayname: string | null; avatar?: string | null } = {
      username: username,
      displayname: displayname,
    };
    
    // Only include avatar if it's provided
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    
    // Update user in database
    await db
      .updateTable("users")
      .set(updateData)
      .where("userid", "=", userId)
      .execute();
    
    // Fetch updated user
    const updatedUser = await db
      .selectFrom("users")
      .select(["userid", "username", "displayname", "avatar"])
      .where("userid", "=", userId)
      .executeTakeFirst();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return {
      userId: updatedUser.userid,
      username: updatedUser.username,
      displayname: updatedUser.displayname,
      avatar: updatedUser.avatar,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

export const deleteUserProfile = async (userId: string): Promise<{ success: boolean; message: string } | null> => {
  try {
    // Check if user exists first
    const existingUser = await db
      .selectFrom("users")
      .selectAll()
      .where("userid", "=", userId)
      .executeTakeFirst();
    
    if (!existingUser) {
      return null;
    }

    // Delete user from database
    await db
      .deleteFrom("users")
      .where("userid", "=", userId)
      .execute();
    
    return {
      success: true,
      message: "User deleted successfully"
    };
    
  } catch (error) {
    console.error('Error deleting user from database:', error);
    throw new Error('Failed to delete user');
  }
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
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('Failed to get user information');
  }
};



// 設定 2FA ：generate QR to bind your device 
export const setup2FA = async (userId: string) => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 生成密鑰
    const secret = speakeasy.generateSecret({
      name: `Pong Game (${user.username})`,
      issuer: 'Best Pong Game'
    });

    // 儲存密鑰到資料庫（但還未啟用）
    await db
      .updateTable("users")
      .set({
        twoFactorSecret: secret.base32,
        twoFactorEnabled: 0,
      })
      .where("userid", "=", userId)
      .execute();

    
    if (!secret.otpauth_url) {
      throw new Error('Failed to create otpauth url');
    }

    // 生成 QR 碼
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw new Error('Failed to setup 2FA');
  }
};

// 啟用 2FA
export const activate2FA = async (userId: string, code: string) => {
  try {
    const user = await getUserById(userId);
    console.log('user: ', user);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA setup not found');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    // activate 2FA
    await db
      .updateTable("users")
      .set({ twoFactorEnabled: 1 })
      .where("userid", "=", userId)
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Error activating 2FA:', error);
    throw error;
  }
};

export const verify2FA = async (tempToken: string, code: string) => {
  try {
    // decode temp token
    const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
    const user = await getUserById(decoded.userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // verify 2FA 
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      throw new Error('Invalid 2FA code');
    }

    // generate final token
    const finalToken = jwt.sign(
      { userId: user.userid, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token: finalToken,
      userId: user.userid
    };
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    throw error;
  }
};

// ----- Online users & status -----
export const getOnlineUsers = async () => {
  const users = await db
    .selectFrom("users")
    .select(["userid", "username", "displayname", "avatar", "status"])
    .where("status", "=", "online")
    .execute();
  return users;
};

export const updateUserStatus = async (
  userId: string,
  status: "online" | "offline"
) => {
  await db
    .updateTable("users")
    .set({ status })
    .where("userid", "=", userId)
    .execute();

  return { userId, status } as const;
};

export const getFriends = async (userId: string) => {
  const friends = await db
    .selectFrom("friends")
    .select(["friendid", "user1", "user2"])
    // .where((qb) =>
    //   qb.where("user1", "=", userId).orWhere("user2", "=", userId)
    // )
    .where((eb) =>
      eb.or([
        eb('user1', '=', userId),
        eb('user2', '=', userId),
      ]))
    .execute();
  return friends;
};

//check DB → 判斷 → 插入 → 再把結果拿回來。
export const createFriendRequest = async (senderId: string, receiverId: string):Promise<Friends> =>{
  // check if user sends request to hiself
  if (senderId === receiverId){
    throw new Error ("you cannot send the request to yourself");
  }

try{
 //pair
 const [user1, user2] = senderId < receiverId? [senderId, receiverId] : [receiverId, senderId]; 

//check if exist
  const existing = await db
  .selectFrom("friends")
  .selectAll()
  .where("user1", "=", user1) 
  .where("user2", "=", user2) 
  .executeTakeFirst()

 if (existing){
    if (existing.friendstatus === "pending"){
      throw new Error ("friend request already sent"); 
    }
    if (existing.friendstatus === "accepted"){
      throw new Error (" you are friends now"); 
    }
    if (existing.friendstatus === "declined"){
      throw new Error ("you got declined, sorry."); 
    }
  }
  //create new friendid 
  const friendid = crypto.randomUUID();
  const newfriend  = await db
    .insertInto("friends")
    .values({
      friendid,
      user1,
      user2,
      friendstatus: "pending",
      requested_by: senderId, 
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  
  //return newfriend;
  return {
    friendid: newfriend.friendid,
    user1: newfriend.user1,
    user2: newfriend.user2,
    friendstatus: newfriend.friendstatus,
    requested_by: newfriend.requested_by,
  };
}catch(err:any)
{
  throw new Error ("friend pair alreay exists");
};
}

export const acceptFriendRequest = async(userId: string, requestId: string):Promise<Friends> => {
 
  
  const existing = await db
  .selectFrom("friends")
  .selectAll()
  .where("friendid","=", requestId)
  .executeTakeFirst();
  if (!existing) {
    throw new Error("request not found");
  }
  if (existing.friendstatus !== "pending")
  {
    throw new Error("the friend request is not pending");
  }
  if(existing.requested_by === userId) {
    throw new Error("you cannot accept your own friend request");
  } 
  const updated = await db
    .updateTable("friends")
    .set({ friendstatus: "accepted" })
    .where("friendid", "=", requestId)
    .returningAll()
    .executeTakeFirstOrThrow();

  return updated;

}


export const RejectedFriendRequest = async(userId: string, requestId: string):Promise<Friends> => {
 
  
  const existing = await db
  .selectFrom("friends")
  .selectAll()
  .where("friendid","=", requestId)
  .executeTakeFirst();
  if (!existing) {
    throw new Error("request not found");
  }
  if (existing.friendstatus !== "accepted")
  {
    throw new Error("the friend request is not pending");
  }
  if(existing.requested_by === userId) {
    throw new Error("you cannot accept your own friend request");
  } 
  const updated = await db
    .updateTable("friends")
    .set({ friendstatus: "declined" })
    .where("friendid", "=", requestId)
    .returningAll()
    .executeTakeFirstOrThrow();

  return updated;

}


export const deletefriendrequest = async(friendId: string, userId: string) : Promise<{ success: boolean; message: string }> => { 
  try {
    const existingFriend = await db
      .selectFrom ("friends")
      .selectAll()
      .where("friendid", "=",friendId )
      .executeTakeFirst();

    if (!existingFriend) {
      throw new Error("no friend exists");
      //return null;
    }
    console.log("Found friend:", existingFriend);
    //delete request
    if (existingFriend.friendstatus !== "pending") {
      throw new Error("Can only delete pending requests");
    }
    if (existingFriend.requested_by !== userId) {
      throw new Error("You can only delete requests you sent");
    }
    await db
      .deleteFrom("friends")
      .where("friendid", "=",friendId )
      .execute();//用途：執行查詢，回傳一個 陣列 (array)。
      
      
      return {
      success:true,
      message: "friend request deleted successfully."
    };
  }catch (err){
    console.error('Error deleting friendrequest from database:', err);
    throw err;
  }
}

export const deletefriend = async(friendId: string, userId: string) : Promise<{ success: boolean; message: string }> => { 
  try {
    const existingFriend = await db
      .selectFrom ("friends")
      .selectAll()
      .where("friendid", "=",friendId )
      .executeTakeFirst();

    if (!existingFriend) {
      throw new Error("no friend exists");
      //return null;
    }
    console.log("Found friend:", existingFriend);
    //delete request
    if (existingFriend.friendstatus == "pending") {
      throw new Error("Cannot delete pending requests");
    }
   
    await db
      .deleteFrom("friends")
      .where("friendid", "=",friendId )
      .execute();//用途：執行查詢，回傳一個 陣列 (array)。
      
      
      return {
      success:true,
      message: "friend deleted successfully."
    };
  }catch (err){
    console.error('Error deleting friend from database:', err);
    throw err;
  }
}