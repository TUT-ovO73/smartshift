import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';
import { awardForCheckin, penalizeAbsent } from '../services/points.js';

const router = Router();

// POST /api/assignments/:id/checkin - 成员签到
// body: { method: 'button' }
router.post('/:id/checkin', (req, res) => {
  const asg = db.prepare(`SELECT * FROM assignments WHERE id = ?`).get(req.params.id);
  if (!asg) return res.status(404).json({ error: '排班不存在' });
  if (asg.user_id !== req.user.id && req.user.role === 'member') {
    return res.status(403).json({ error: '只能为自己的班次签到' });
  }
  if (asg.status === 'confirmed') return res.status(400).json({ error: '已确认完成' });
  if (asg.status === 'absent') return res.status(400).json({ error: '已标记缺席' });
  const method = req.body?.method || 'button';
  db.prepare(`
    UPDATE assignments SET status = 'checked_in', check_in_time = datetime('now'),
                          check_in_method = ?
    WHERE id = ?
  `).run(method, req.params.id);
  const updated = db.prepare(`SELECT * FROM assignments WHERE id = ?`).get(req.params.id);
  res.json({ assignment: updated });
});

// POST /api/assignments/:id/confirm - 管理员确认完成并发积分
router.post('/:id/confirm', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const asg = db.prepare(`
    SELECT a.*, s.title, s.date, s.start_time, s.end_time, s.is_special, s.team_id
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!asg) return res.status(404).json({ error: '排班不存在' });

  if (asg.status === 'confirmed') return res.status(400).json({ error: '已确认完成' });

  if (asg.status === 'absent') {
    return res.status(400).json({ error: '已标记为缺席，不可确认' });
  }

  // 标记完成 + 发积分
  db.prepare(`UPDATE assignments SET status = 'confirmed' WHERE id = ?`).run(req.params.id);
  const delta = awardForCheckin(asg, asg);
  res.json({ ok: true, points_awarded: delta });
});

// POST /api/assignments/:id/absent - 管理员标记缺席
router.post('/:id/absent', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const asg = db.prepare(`SELECT * FROM assignments WHERE id = ?`).get(req.params.id);
  if (!asg) return res.status(404).json({ error: '排班不存在' });
  db.prepare(`UPDATE assignments SET status = 'absent' WHERE id = ?`).run(req.params.id);
  penalizeAbsent(asg);
  res.json({ ok: true });
});

export default router;
