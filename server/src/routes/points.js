import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config.js';
import { getBalance, getLedger, getTeamLedger, manualAdjust } from '../services/points.js';

const router = Router();

// GET /api/users/me/points
router.get('/users/me/points', requireAuth, (req, res) => {
  const bal = getBalance(req.user.id);
  const ledger = getLedger(req.user.id, 100);
  res.json({ balance: bal, ledger });
});

// GET /api/users/:id/points
router.get('/users/:id/points', requireAuth, (req, res) => {
  const bal = getBalance(Number(req.params.id));
  const ledger = getLedger(Number(req.params.id), 100);
  res.json({ balance: bal, ledger });
});

// POST /api/users/:id/points/adjust (admin)
router.post('/users/:id/points/adjust', requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.SCHEDULE_ADMIN), (req, res) => {
  const { delta = 0, reason } = req.body || {};
  if (!reason) return res.status(400).json({ error: 'reason 必填' });
  manualAdjust(Number(req.params.id), Number(delta), reason);
  const bal = getBalance(Number(req.params.id));
  res.json({ ok: true, balance: bal });
});

// GET /api/teams/:id/points/ledger
router.get('/teams/:id/points/ledger', requireAuth, (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const ledger = getTeamLedger(Number(req.params.id), limit);
  res.json({ ledger });
});

export default router;
