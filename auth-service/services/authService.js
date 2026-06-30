// [SOLID: SRP] — regra de negócio de autenticação isolada da camada HTTP
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function register(userData) {
    const nome_completo = userData.nome_completo || userData.name;
    const senha = userData.senha || userData.password;
    const { email, cpf, oab_numero } = userData;
    const tipo = userData.tipo || (userData.perfil === 'Advogado' ? 'advogado' : 'comum');

    if (!['advogado', 'comum'].includes(tipo)) {
        throw { status: 400, message: "Tipo inválido. Use 'advogado' ou 'comum'." };
    }

    if (!nome_completo || !email || !senha || !cpf || !tipo) {
        const err = new Error('Campos obrigatórios: nome_completo, email, senha, cpf, tipo.');
        err.code = 'MISSING_FIELDS';
        throw err;
    }

    if (tipo === 'advogado' && !oab_numero) {
        const err = new Error('Campo oab_numero é obrigatório para advogados.');
        err.code = 'MISSING_FIELDS';
        throw err;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
        const err = new Error('Email já cadastrado.');
        err.code = 'DUPLICATE_EMAIL';
        throw err;
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const user = await userRepository.createUser({
        nome_completo,
        email,
        senha_hash,
        cpf,
        tipo,
        oab_numero: tipo === 'advogado' ? oab_numero : null,
    });

    return { userId: user.id, email: user.email, tipo: user.tipo };
}

// [SOLID: SRP] — regra de negócio de login isolada da camada HTTP
async function login(email, senha) {
    if (!email || !senha) {
        const err = new Error('Credenciais inválidas.');
        err.status = 401;
        throw err;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
        const err = new Error('Credenciais inválidas.');
        err.status = 401;
        throw err;
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
        const err = new Error('Credenciais inválidas.');
        err.status = 401;
        throw err;
    }

    const token = jwt.sign(
        { userId: user.id, email: user.email, tipo: user.tipo },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, user: { nome_completo: user.nome_completo, email: user.email, tipo: user.tipo } };
}

async function requestPasswordReset(email) {
    if (!email) {
        const err = new Error('Email e obrigatorio.');
        err.status = 400;
        throw err;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
        return {
            message: 'Se o email estiver cadastrado, um link de recuperacao sera enviado.',
        };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await userRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    console.log(`[Auth Service] Email simulado para ${email}: token de recuperacao ${token}`);

    return {
        message: 'Se o email estiver cadastrado, um link de recuperacao sera enviado.',
        resetToken: token,
        expiresAt,
    };
}

async function resetPassword(token, novaSenha) {
    if (!token || !novaSenha) {
        const err = new Error('Token e novaSenha sao obrigatorios.');
        err.status = 400;
        throw err;
    }

    if (novaSenha.length < 6) {
        const err = new Error('A nova senha deve ter pelo menos 6 caracteres.');
        err.status = 400;
        throw err;
    }

    const tokenHash = hashToken(token);
    const resetToken = await userRepository.findValidPasswordResetToken(tokenHash);
    if (!resetToken) {
        const err = new Error('Token invalido ou expirado.');
        err.status = 400;
        throw err;
    }

    const senha_hash = await bcrypt.hash(novaSenha, 10);
    await userRepository.updatePassword(resetToken.user_id, senha_hash);
    await userRepository.markPasswordResetTokenUsed(resetToken.id);

    return { message: 'Senha redefinida com sucesso.' };
}

module.exports = { register, login, requestPasswordReset, resetPassword };
