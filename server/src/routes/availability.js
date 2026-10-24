import { Router } from 'express';
import { db, transaction } from '../db.js';

const router = Router();

// GET /api/availability?user_id=&from=&to=
router.get('/', (req, res) => {
  const { user_id, from, to } = req.query;
  // 默认查自己；管理员可查他人
  const targetUserId = user_id || req.user.id;
  if (user_id && String(user_id) !== String(req.user.id) && req.user.role === 'member') {
    return res.status(403).json({ error: '只能查看自己的可用时间' });
  }
  let sql = `SELECT * FROM availability WHERE user_id = ?`;
  const params = [targetUserId];
  if (from && to) {
    sql += ` AND date >= ? AND date <= ?`;
    params.push(from, to);
  }
  sql += ` ORDER BY date ASC`;
  const list = db.prepare(sql).all(...params);
  res.json({ availability: list });
});

// PUT /api/availability (upsert)
router.put('/', (req, res) => {
  const { date, unavailable_slots = [], preferred_shift_type = 'any' } = req.body || {};
  if (!date) return res.status(400).json({ error: 'date 必填' });
  const slotsJson = JSON.stringify(unavailable_slots || []);
  db.prepare(`
    INSERT INTO availability (user_id, date, unavailable_slots, preferred_shift_type)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      unavailable_slots = excluded.unavailable_slots,
      preferred_shift_type = excluded.preferred_shift_type
  `).run(req.user.id, date, slotsJson, preferred_shift_type);
  const avail = db.prepare(`SELECT * FROM availability WHERE user_id = ? AND date = ?`).get(req.user.id, date);
  res.json({ availability: avail });
});

// 批量保存
router.put('/batch', (req, res) => {
  const items = req.body?.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items 必填且为数组' });
  }
  const stmt = db.prepare(`
    INSERT INTO availability (user_id, date, unavailable_slots, preferred_shift_type)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      unavailable_slots = excluded.unavailable_slots,
      preferred_shift_type = excluded.preferred_shift_type
  `);
  const tx = transaction((rows) => {
    for (const r of rows) {
      stmt.run(
        req.user.id,
        r.date,
        JSON.stringify(r.unavailable_slots || []),
        r.preferred_shift_type || 'any'
      );
    }
  });
  tx(items);
  res.json({ ok: true, count: items.length });
});

export default router;
