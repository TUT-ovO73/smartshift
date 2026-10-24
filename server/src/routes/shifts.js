import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';
import { timeToMin } from '../services/scoring.js';

const router = Router();

// GET /api/teams/:id/shifts?from=&to=
router.get('/teams/:id/shifts', (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT * FROM shifts WHERE team_id = ?`;
  const params = [req.params.id];
  if (from && to) {
    sql += ` AND date >= ? AND date <= ?`;
    params.push(from, to);
  }
  sql += ` ORDER BY date ASC, start_time ASC`;
  const shifts = db.prepare(sql).all(...params);
  res.json({ shifts });
});

// POST /api/teams/:id/shifts (admin)
router.post('/teams/:id/shifts', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const {
    title,
    date,
    start_time,
    end_time,
    location_text = '',
    required_count = 1,
    is_special = 0,
    priority_weight = 0,
  } = req.body || {};
  if (!title || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'title/date/start_time/end_time 必填' });
  }
  const duration_min = timeToMin(end_time) - timeToMin(start_time);
  const info = db.prepare(`
    INSERT INTO shifts (team_id, title, date, start_time, end_time, duration_min, location_text,
                       required_count, is_special, priority_weight)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, title, date, start_time, end_time, duration_min, location_text,
         required_count, is_special ? 1 : 0, priority_weight);
  const shift = db.prepare(`SELECT * FROM shifts WHERE id = ?`).get(info.lastInsertRowid);
  res.json({ shift });
});

// GET /api/shifts/:id
router.get('/shifts/:id', (req, res) => {
  const shift = db.prepare(`SELECT * FROM shifts WHERE id = ?`).get(req.params.id);
  if (!shift) return res.status(404).json({ error: '班次不存在' });
  res.json({ shift });
});

// PATCH /api/shifts/:id (admin)
router.patch('/shifts/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const allowed = ['title', 'date', 'start_time', 'end_time', 'location_text',
                   'required_count', 'is_special', 'priority_weight', 'status'];
  const sets = [];
  const vals = [];
  for (const f of allowed) {
    if (req.body?.[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: '没有可更新字段' });
  vals.push(req.params.id);
  db.prepare(`UPDATE shifts SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  // 若修改了时间，重新计算 duration
  if (req.body?.start_time && req.body?.end_time) {
    const dur = timeToMin(req.body.end_time) - timeToMin(req.body.start_time);
    db.prepare(`UPDATE shifts SET duration_min = ? WHERE id = ?`).run(dur, req.params.id);
  }
  const shift = db.prepare(`SELECT * FROM shifts WHERE id = ?`).get(req.params.id);
  res.json({ shift });
});

// DELETE /api/shifts/:id (admin)
router.delete('/shifts/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  db.prepare(`DELETE FROM shifts WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

export default router;
