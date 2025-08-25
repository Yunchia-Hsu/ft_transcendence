import jwt from 'jsonwebtoken';


// define JWT payload interface定義 JWT 解碼後的結構
interface JWTPayload {
  userId: string;
  iat?: number;  // issued at
  exp?: number;  // expiration time
  [key: string]: any;  // 允許其他可選屬性
}

// defince activated outcome interface定義回傳值的結構
interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  error?: string;
}
export const extractUserIdFromToken = (authHeader: string | undefined) => {
  try {
    // 預期格式：'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }

    const token:string = authHeader.substring(7); // 移除 'Bearer ' 
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    if (!decoded.userId) {
        throw new Error('Token does not contain userId');
    }
    
    return decoded.userId; // 假設你的 JWT payload 有 userId
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyToken = (authHeader: string | undefined): TokenVerificationResult => {
  try {
    const userId = extractUserIdFromToken(authHeader);
    return { valid: true, userId };
  } catch (error) {
    return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};