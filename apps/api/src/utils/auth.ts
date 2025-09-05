import jwt from 'jsonwebtoken';


// define JWT payload interface定義 JWT 解碼後的結構
export interface JWTPayload {
  userId: string;
  iat?: number;  // issued at
  exp?: number;  // expiration time
  [key: string]: any;  // 允許其他可選屬性
}

// defince activated outcome interface定義回傳值的結構
interface TokenVerificationResult {
  valid: boolean;
  userId?: string | null;
  error?: string;
}
export const extractUserIdFromToken = (authHeader: string) => {
  try {
    let token: string;
    // 檢查是否有 Bearer 前綴
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    const jwtSecret = 'secret';
    console.log('jwtsecret: ', jwtSecret);
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    if (!decoded.userId) {
        throw new Error('Token does not contain userId');
    }
    
    return decoded.userId; 
  } catch (error) {

    console.log('Token verification error:', error);
          
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token format');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else {
      throw new Error('Invalid or Expired token');
    }
  }
};



export function verifyToken(authHeader: string): TokenVerificationResult {
  try {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, 'secret') as { userId: string };//JWT_SECRET
    //console.log("[DELETE /users/:userId] header =", token);

    return {
      valid: true,
      userId: decoded.userId,
      error: '',
    };
  } catch (err) {
    return {
      valid: false,
      userId: null,
      error: 'Invalid token formatttt',
    };
  }
}

