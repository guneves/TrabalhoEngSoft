// [SOLID: SRP] — encapsula todo acesso SQL à tabela users
// [SOLID: DIP] — depende do módulo db.js, não de pg diretamente
const { pool } = require('../db');

async function createUser(data) {
    const { nome_completo, email, senha_hash, cpf, tipo, oab_numero } = data;
    const result = await pool.query(
        `INSERT INTO users (nome_completo, email, senha_hash, cpf, tipo, oab_numero)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nome_completo, email, cpf, tipo, oab_numero, created_at`,
        [nome_completo, email, senha_hash, cpf || null, tipo, oab_numero || null]
    );
    return result.rows[0];
}

async function findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function updatePassword(userId, senha_hash) {
    await pool.query('UPDATE users SET senha_hash = $1 WHERE id = $2', [senha_hash, userId]);
}

async function createPasswordResetToken(userId, tokenHash, expiresAt) {
    const result = await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, token_hash, expires_at, used_at, created_at`,
        [userId, tokenHash, expiresAt]
    );
    return result.rows[0];
}

async function findValidPasswordResetToken(tokenHash) {
    const result = await pool.query(
        `SELECT *
           FROM password_reset_tokens
          WHERE token_hash = $1
            AND used_at IS NULL
            AND expires_at > NOW()`,
        [tokenHash]
    );
    return result.rows[0] || null;
}

async function markPasswordResetTokenUsed(tokenId) {
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);
}

module.exports = {
    createUser,
    findByEmail,
    updatePassword,
    createPasswordResetToken,
    findValidPasswordResetToken,
    markPasswordResetTokenUsed,
};
