import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';
import {
  generateSchedule,
  cacheDraft,
  getCachedDraft,
  clearDraft,
  publishSchedule,
} from '../services/scheduler.js';

const router = Router();

// POST /api/teams/:id/schedule/generate
// body: { from, to }
router.post('/:id/schedule/generate', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: 'from 和 to 必填' });
  const result = generateSchedule(Number(req.params.id), from, to);
  cacheDraft(Number(req.params.id), result);
  res.json(result);
});

// GET /api/teams/:id/schedule/draft
router.get('/:id/schedule/draft', (req, res) => {
  const draft = getCachedDraft(Number(req.params.id));
  if (!draft) return res.status(404).json({ error: '没有缓存的草案，请先生成' });
  res.json(draft);
});

// POST /api/teams/:id/schedule/publish
// body: { assignments: [{shift_id, user_id, score, reason}] }
router.post('/:id/schedule/publish', requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const items = req.body?.assignments || [];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'assignments 必填' });
  }
  const result = publishSchedule(Number(req.params.id), items);
  clearDraft(Number(req.params.id));
  res.json(result);
});

export default router;
