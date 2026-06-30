const { pool } = require('../db');

async function create(data) {
  const { userId, title, description, evidenceType, targetUrl, metadata } = data;
  const result = await pool.query(
    `INSERT INTO evidence_requests
       (user_id, title, description, evidence_type, target_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, title, description || null, evidenceType || 'digital', targetUrl || null, metadata || {}]
  );
  return result.rows[0];
}

async function listByUser(userId) {
  const result = await pool.query(
    `SELECT *
       FROM evidence_requests
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC`,
    [userId]
  );
  return result.rows;
}

async function findByIdAndUser(id, userId) {
  const result = await pool.query(
    `SELECT *
       FROM evidence_requests
      WHERE id = $1
        AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

module.exports = { create, listByUser, findByIdAndUser };
