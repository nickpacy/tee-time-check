// api/controllers/communicationsController.js
const { pool } = require('../database');

// ---------- helpers ----------
const coerceLimit = (v, def = 200, max = 1000) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(1, n), max) : def;
};

const baseAgg = () => ({ sent: 0, failed: 0, queued: 0, skipped: 0 });

const timeWindowFromHours = async (hours = 24) => {
  const hrs = Math.min(Number(hours) || 24, 24 * 7); // cap at 7 days
  const [[{ now }]] = await pool.query('SELECT UTC_TIMESTAMP() AS now');
  const [[{ startTs }]] = await pool.execute(
    'SELECT (UTC_TIMESTAMP() - INTERVAL ? HOUR) AS startTs',
    [hrs]
  );
  return { start: startTs, end: now };
};

const aggregateByTypeStatus = async (whereSql, params) => {
  const [agg] = await pool.execute(
    `SELECT c.MessageType, c.Status, COUNT(*) AS cnt
       FROM communications c
       ${whereSql}
       GROUP BY c.MessageType, c.Status`,
    params
  );
  const [tot] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM communications c
       ${whereSql}`,
    params
  );

  const out = { total: tot[0]?.total || 0, email: baseAgg(), sms: baseAgg(), push: baseAgg() };
  for (const r of agg) {
    const t = r.MessageType;
    const s = r.Status;
    if (out[t] && s in out[t]) out[t][s] = r.cnt;
  }
  return out;
};

// ---------- SELF (current user from req.user.userId) ----------
const listSelf = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const { from, to } = req.query;
    const limit = coerceLimit(req.query.limit);

    const clauses = ['c.UserId = ?'];
    const params = [userId];
    if (from) { clauses.push('c.SentTime >= ?'); params.push(from); }
    if (to)   { clauses.push('c.SentTime < ?');  params.push(to);   }

    const where = `WHERE ${clauses.join(' AND ')}`;

    const [rows] = await pool.execute(
      `
      SELECT c.CommunicationId, c.UserId, c.MessageType, c.Status, c.SentTo, c.SentTime, c.CreatedAt
        FROM communications c
        ${where}
        ORDER BY c.SentTime DESC
        LIMIT ${limit}   -- inline LIMIT to avoid ER_WRONG_ARGUMENTS
      `,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

const summarySelf = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
    const { start, end } = await timeWindowFromHours(req.query.hours);
    const where = `WHERE c.UserId = ? AND c.SentTime >= ? AND c.SentTime < ?`;
    const data = await aggregateByTypeStatus(where, [userId, start, end]);
    res.json({ windowStart: start, windowEnd: end, ...data });
  } catch (e) { next(e); }
};

const smsCountTodaySelf = async (req, res, next) => {
  try {
    const userId = Number(req.user.userId);
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS cnt
         FROM communications
        WHERE UserId = ?
          AND MessageType = 'sms'
          AND SentTime >= UTC_DATE()
          AND SentTime <  UTC_DATE() + INTERVAL 1 DAY`,
      [userId]
    );
    res.json({ userId, count: rows[0]?.cnt || 0 });
  } catch (e) { next(e); }
};

// ---------- PER USER (authorized by requireSelfOrAdmin) ----------
const listUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const { from, to } = req.query;
    const limit = coerceLimit(req.query.limit);

    const clauses = ['c.UserId = ?'];
    const params = [userId];
    if (from) { clauses.push('c.SentTime >= ?'); params.push(from); }
    if (to)   { clauses.push('c.SentTime < ?');  params.push(to);   }

    const where = `WHERE ${clauses.join(' AND ')}`;

    const [rows] = await pool.execute(
      `
      SELECT c.CommunicationId, c.UserId, c.MessageType, c.Status, c.SentTo, c.SentTime, c.CreatedAt
        FROM communications c
        ${where}
        ORDER BY c.SentTime DESC
        LIMIT ${limit}   -- inline LIMIT to avoid ER_WRONG_ARGUMENTS
      `,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

const summaryUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const { start, end } = await timeWindowFromHours(req.query.hours);
    const where = `WHERE c.UserId = ? AND c.SentTime >= ? AND c.SentTime < ?`;
    const data = await aggregateByTypeStatus(where, [userId, start, end]);
    res.json({ windowStart: start, windowEnd: end, ...data });
  } catch (e) { next(e); }
};

const smsCountTodayUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS cnt
         FROM communications
        WHERE UserId = ?
          AND MessageType = 'sms'
          AND SentTime >= UTC_DATE()
          AND SentTime <  UTC_DATE() + INTERVAL 1 DAY`,
      [userId]
    );
    res.json({ userId, count: rows[0]?.cnt || 0 });
  } catch (e) { next(e); }
};

// ---------- GLOBAL (admin only) ----------
const listAll = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const limit = coerceLimit(req.query.limit);

    const clauses = [];
    const params = [];
    if (from) { clauses.push('c.SentTime >= ?'); params.push(from); }
    if (to)   { clauses.push('c.SentTime < ?');  params.push(to);   }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `
      SELECT c.CommunicationId, c.UserId, c.MessageType, c.Status, c.SentTo, c.SentTime, c.CreatedAt
        FROM communications c
        ${where}
        ORDER BY c.SentTime DESC
        LIMIT ${limit}   -- inline LIMIT to avoid ER_WRONG_ARGUMENTS
      `,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
};

const summaryAll = async (req, res, next) => {
  try {
    const { start, end } = await timeWindowFromHours(req.query.hours);
    const where = `WHERE c.SentTime >= ? AND c.SentTime < ?`;
    const data = await aggregateByTypeStatus(where, [start, end]);
    res.json({ windowStart: start, windowEnd: end, ...data });
  } catch (e) { next(e); }
};

module.exports = {
  listSelf,
  summarySelf,
  smsCountTodaySelf,
  listUser,
  summaryUser,
  smsCountTodayUser,
  listAll,
  summaryAll,
};
