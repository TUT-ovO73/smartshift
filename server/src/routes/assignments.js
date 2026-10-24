import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';

const router = Router();

// GET /api/assignments?team_id=&user_id=&from=&to=
router.get('/', (req, res) => {
  const { team_id, user_id, from, to } = req.query;
  let sql = `
    SELECT a.*, s.title, s.date, s.start_time, s.end_time, s.location_text,
           s.is_special, s.required_count, s.team_id,
           u.username, u.name
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    JOIN users u ON u.id = a.user_id
    WHERE 1=1
  `;
  const params = [];
  if (team_id) { sql += ` AND s.team_id = ?`; params.push(team_id); }
  if (user_id) { sql += ` AND a.user_id = ?`; params.push(user_id); }
  if (from) { sql += ` AND s.date >= ?`; params.push(from); }
  if (to) { sql += ` AND s.date <= ?`; params.push(to); }
  sql += ` ORDER BY s.date ASC, s.start_time ASC`;
  const list = db.prepare(sql).all(...params);
  res.json({ assignments: list });
});

// GET /api/assignments/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT a.*, s.title, s.date, s.start_time, s.end_time, s.location_text, s.is_special, s.team_id
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: '排班不存在' });
  res.json({ assignment: row });
});

// PATCH /api/assignments/:id - 手动换人 (admin)
router.patch('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const { user_id, score, reason } = req.body || {};
  if (user_id !== undefined) {
    // 删除原记录，避免 UNIQUE(shift_id, user_id) 冲突；改为更新 user_id
    const asg = db.prepare(`SELECT * FROM assignments WHERE id = ?`).get(req.params.id);
    if (!asg) return res.status(404).json({ error: '排班不存在' });
    // 先删冲突
    db.prepare(`DELETE FROM assignments WHERE shift_id = ? AND user_id = ?`).run(asg.shift_id, user_id);
    db.prepare(`UPDATE assignments SET user_id = ?, score = ?, reason = ? WHERE id = ?`)
      .run(user_id, score ?? 0, JSON.stringify(reason || []), req.params.id);
  } else if (score !== undefined) {
    db.prepare(`UPDATE assignments SET score = ?, reason = ? WHERE id = ?`)
      .run(score, JSON.stringify(reason || []), req.params.id);
  }
  const a = db.prepare(`SELECT * FROM assignments WHERE id = ?`).get(req.params.id);
  res.json({ assignment: a });
});

// DELETE /api/assignments/:id (admin)
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  db.prepare(`DELETE FROM assignments WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
