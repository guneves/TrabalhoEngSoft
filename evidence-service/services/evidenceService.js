const evidenceRepository = require('../repositories/evidenceRepository');
const { createZip } = require('../utils/zipBuilder');

function normalizePayload(body) {
  return {
    title: body.title || body.titulo || body.nome,
    description: body.description || body.descricao || null,
    evidenceType: body.evidenceType || body.tipo_prova || body.tipo || 'digital',
    targetUrl: body.targetUrl || body.url || body.link || null,
    metadata: body.metadata || body.metadados || {},
  };
}

async function createRequest(userId, body) {
  const payload = normalizePayload(body || {});

  if (!payload.title) {
    const err = new Error('Campo title ou titulo e obrigatorio.');
    err.status = 400;
    throw err;
  }

  if (typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
    const err = new Error('Campo metadata deve ser um objeto JSON.');
    err.status = 400;
    throw err;
  }

  return evidenceRepository.create({ userId, ...payload });
}

async function listRequests(userId) {
  return evidenceRepository.listByUser(userId);
}

async function getRequest(userId, id) {
  const parsedId = Number.parseInt(id, 10);
  if (!Number.isInteger(parsedId)) {
    const err = new Error('ID invalido.');
    err.status = 400;
    throw err;
  }

  const request = await evidenceRepository.findByIdAndUser(parsedId, userId);
  if (!request) {
    const err = new Error('Solicitacao de prova nao encontrada.');
    err.status = 404;
    throw err;
  }

  return request;
}

async function buildDownloadZip(userId, id) {
  const request = await getRequest(userId, id);
  const report = {
    generatedAt: new Date().toISOString(),
    notice: 'Arquivo final simulado. A captura real de midia ainda nao foi executada.',
    evidenceRequest: request,
  };

  return createZip([
    {
      name: `evidence-request-${request.id}.json`,
      content: JSON.stringify(report, null, 2),
    },
    {
      name: 'relatorio.txt',
      content: [
        `Solicitacao: ${request.title}`,
        `Status: ${request.status}`,
        `Tipo: ${request.evidence_type}`,
        `URL alvo: ${request.target_url || 'nao informada'}`,
        `Criada em: ${request.created_at}`,
        '',
        'Este ZIP e uma simulacao do arquivo final da prova digital.',
      ].join('\n'),
    },
  ]);
}

module.exports = { createRequest, listRequests, getRequest, buildDownloadZip };
