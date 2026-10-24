import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/teams/:id/stats/overview
router.get('/teams/:id/stats/overview', requireAuth, (req, res) => {
  const teamId = Number(req.params.id);

  const totalShifts = db.prepare(`SELECT COUNT(*) AS c FROM shifts WHERE team_id = ?`).get(teamId).c;
  const publishedShifts = db.prepare(`SELECT COUNT(*) AS c FROM shifts WHERE team_id = ? AND status = 'published'`).get(teamId).c;
  const totalAssignments = db.prepare(`
    SELECT COUNT(*) AS c FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE s.team_id = ?
  `).get(teamId).c;
  const confirmedAssignments = db.prepare(`
    SELECT COUNT(*) AS c FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE s.team_id = ? AND a.status = 'confirmed'
  `).get(teamId).c;
  const checkedIn = db.prepare(`
    SELECT COUNT(*) AS c FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE s.team_id = ? AND a.status IN ('checked_in', 'confirmed')
  `).get(teamId).c;
  const absent = db.prepare(`
    SELECT COUNT(*) AS c FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE s.team_id = ? AND a.status = 'absent'
  `).get(teamId).c;

  // 团队成员数
  const memberCount = db.prepare(`SELECT COUNT(*) AS c FROM team_members WHERE team_id = ?`).get(teamId).c;

  // 积分榜
  const leaderboard = db.prepare(`
    SELECT u.id, u.username, u.name, u.points, u.credit,
           COUNT(a.id) AS shift_count,
           SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS completed_count
    FROM users u
    JOIN team_members tm ON tm.user_id = u.id AND tm.team_id = ?
    LEFT JOIN assignments a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY u.points DESC, completed_count DESC
    LIMIT 20
  `).all(teamId);

  const completionRate = totalAssignments ? Math.round((confirmedAssignments / totalAssignments) * 100) : 0;

  res.json({
    overview: {
      total_shifts: totalShifts,
      published_shifts: publishedShifts,
      total_assignments: totalAssignments,
      confirmed_assignments: confirmedAssignments,
      checked_in: checkedIn,
      absent,
      member_count: memberCount,
      completion_rate: completionRate,
    },
    leaderboard,
  });
});

// GET /api/users/:id/stats/personal
router.get('/users/:id/stats/personal', requireAuth, (req, res) => {
  const userId = Number(req.params.id);

  const totalAssignments = db.prepare(`SELECT COUNT(*) AS c FROM assignments WHERE user_id = ?`).get(userId).c;
  const confirmed = db.prepare(`SELECT COUNT(*) AS c FROM assignments WHERE user_id = ? AND status = 'confirmed'`).get(userId).c;
  const absent = db.prepare(`SELECT COUNT(*) AS c FROM assignments WHERE user_id = ? AND status = 'absent'`).get(userId).c;
  const totalMinutes = db.prepare(`
    SELECT COALESCE(SUM(s.duration_min), 0) AS m
    FROM assignments a
    JOIN shifts s ON s.id = a.shift_id
    WHERE a.user_id = ? AND a.status = 'confirmed'
  `).get(userId).m;

  const balance = db.prepare(`SELECT points, credit FROM users WHERE id = ?`).get(userId);

  res.json({
    personal: {
      total_assignments: totalAssignments,
      completed: confirmed,
      absent,
      total_minutes: totalMinutes,
      total_hours: Math.round((totalMinutes / 60) * 10) / 10,
      points: balance?.points || 0,
      credit: balance?.credit || 0,
    },
  });
});

// GET /api/teams/:id/stats/completion
router.get('/teams/:id/stats/completion', requireAuth, (req, res) => {
  const teamId = Number(req.params.id);
  // 按日期分组的完成情况
  const rows = db.prepare(`
    SELECT s.date,
           COUNT(a.id) AS assigned,
           SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
           SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent
    FROM shifts s
    LEFT JOIN assignments a ON a.shift_id = s.id
    WHERE s.team_id = ? AND s.status = 'published'
    GROUP BY s.date
    ORDER BY s.date ASC
  `).all(teamId);
  res.json({ by_date: rows });
});

export default router;
