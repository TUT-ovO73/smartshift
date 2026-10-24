import { Router } from 'express';
import { db } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES, DEFAULT_TEAM_NAME } from '../config.js';

const router = Router();

// GET /api/teams - 列出我加入的团队
router.get('/', (req, res) => {
  const teams = db.prepare(`
    SELECT t.*, tm.role_in_team
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ?
    ORDER BY t.id
  `).all(req.user.id);
  res.json({ teams });
});

// GET /api/teams/:id
router.get('/:id', (req, res) => {
  const team = db.prepare(`SELECT * FROM teams WHERE id = ?`).get(req.params.id);
  if (!team) return res.status(404).json({ error: '团队不存在' });
  res.json({ team });
});

// POST /api/teams  (super_admin)
router.post('/', requireRole(ROLES.SUPER_ADMIN), (req, res) => {
  const name = req.body?.name || DEFAULT_TEAM_NAME;
  const info = db.prepare(`INSERT INTO teams (name, creator_id) VALUES (?, ?)`).run(name, req.user.id);
  // 创建者自动加入团队
  db.prepare(`
    INSERT INTO team_members (team_id, user_id, role_in_team)
    VALUES (?, ?, 'super_admin')
  `).run(info.lastInsertRowid, req.user.id);
  res.json({ id: info.lastInsertRowid, name, creator_id: req.user.id });
});

// GET /api/teams/:id/members
router.get('/:id/members', (req, res) => {
  const members = db.prepare(`
    SELECT tm.id AS member_id, tm.user_id, tm.role_in_team, tm.credit, tm.points_balance, tm.manual_weight,
           u.username, u.name, u.role AS user_role, u.points
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
    ORDER BY tm.id
  `).all(req.params.id);
  res.json({ members });
});

// POST /api/teams/:id/members (admin: 邀请已有用户加入团队)
router.post('/:id/members', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const { user_id, role_in_team = ROLES.MEMBER, credit = 100 } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id 必填' });
  try {
    db.prepare(`
      INSERT INTO team_members (team_id, user_id, role_in_team, credit)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, user_id, role_in_team, credit);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: '已是团队成员或参数无效' });
  }
});

// PATCH /api/teams/:id/members/:memberId (admin: 调整角色/信用/手动加权)
router.patch('/:id/members/:memberId', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const fields = ['role_in_team', 'credit', 'points_balance', 'manual_weight'];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (req.body?.[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: '没有可更新字段' });
  vals.push(req.params.memberId);
  db.prepare(`UPDATE team_members SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const m = db.prepare(`SELECT * FROM team_members WHERE id = ?`).get(req.params.memberId);
  res.json({ member: m });
});

// DELETE /api/teams/:id/members/:memberId
router.delete('/:id/members/:memberId', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  db.prepare(`DELETE FROM team_members WHERE id = ?`).run(req.params.memberId);
  res.json({ ok: true });
});

export default router;
