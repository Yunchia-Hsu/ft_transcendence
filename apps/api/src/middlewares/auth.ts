import { MiddlewareHandler } from 'hono';
import jwt from 'jsonwebtoken';

export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string };
    c.set('userId', payload.sub);     
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
