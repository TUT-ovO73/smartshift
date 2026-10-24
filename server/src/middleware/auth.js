import { verifyToken } from '../utils/jwt.js';

// 校验 JWT，挂 req.user = { id, username, role }
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'token 无效或已过期' });
  req.user = payload;
  next();
}

// 角色守卫
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}
