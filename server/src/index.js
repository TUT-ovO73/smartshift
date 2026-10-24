import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORT } from './config.js';
import { db } from './db.js';
import { requireAuth } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import teamRoutes from './routes/teams.js';
import shiftRoutes from './routes/shifts.js';
import availabilityRoutes from './routes/availability.js';
import assignmentRoutes from './routes/assignments.js';
import schedulingRoutes from './routes/scheduling.js';
import checkinRoutes from './routes/checkin.js';
import pointsRoutes from './routes/points.js';
import statsRoutes from './routes/stats.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/teams', requireAuth, teamRoutes);
app.use('/api/teams', requireAuth, schedulingRoutes);
app.use('/api', requireAuth, shiftRoutes);
app.use('/api/availability', requireAuth, availabilityRoutes);
app.use('/api/assignments', requireAuth, assignmentRoutes);
app.use('/api/assignments', requireAuth, checkinRoutes);
app.use('/api', pointsRoutes);
app.use('/api', statsRoutes);

// 部署模式：托管前端构建产物（本地开发时 public 目录不存在，仍走 Vite 代理）
const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
if (existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(join(PUBLIC_DIR, 'index.html'));
  });
}

// 云平台临时磁盘：空库时自动灌入演示数据，重启后自动恢复完整演示环境
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  console.log('[SEED] 检测到空数据库，自动灌入演示数据...');
  await import('./seed.js');
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`SmartShift server running at http://localhost:${PORT}`);
});
