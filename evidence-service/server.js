const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middlewares/auth');
const evidenceService = require('./services/evidenceService');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/evidence/requests', authMiddleware, async (req, res) => {
  try {
    const request = await evidenceService.createRequest(req.user.userId, req.body);
    res.status(201).json(request);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[Evidence Service] Erro ao criar solicitacao:', err.message);
    return res.status(500).json({ error: 'Erro ao criar solicitacao de prova.' });
  }
});

app.get('/evidence/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await evidenceService.listRequests(req.user.userId);
    res.status(200).json(requests);
  } catch (err) {
    console.error('[Evidence Service] Erro ao listar solicitacoes:', err.message);
    res.status(500).json({ error: 'Erro ao listar solicitacoes de prova.' });
  }
});

app.get('/evidence/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await evidenceService.getRequest(req.user.userId, req.params.id);
    res.status(200).json(request);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[Evidence Service] Erro ao buscar solicitacao:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar solicitacao de prova.' });
  }
});

app.get('/evidence/requests/:id/download', authMiddleware, async (req, res) => {
  try {
    const zip = await evidenceService.buildDownloadZip(req.user.userId, req.params.id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="evidence-request-${req.params.id}.zip"`);
    res.status(200).send(zip);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[Evidence Service] Erro ao gerar ZIP:', err.message);
    return res.status(500).json({ error: 'Erro ao gerar arquivo final simulado.' });
  }
});

app.listen(3003, () => console.log('=> Evidence Service ativo na porta 3003'));
