const queueEngine = require('../services/queueEngine');
const config = require('../config');

async function systemRoutes(fastify, options) {
  // Get System Mode
  fastify.get('/api/system/mode', async () => {
    return queueEngine.getModeInfo();
  });

  // Switch System Mode ('demo' or 'real')
  fastify.post('/api/system/mode', async (request, reply) => {
    const { mode } = request.body || {};
    if (!mode || (mode !== 'demo' && mode !== 'real')) {
      return reply.code(400).send({ error: "Invalid mode. Must be 'demo' or 'real'" });
    }
    const updated = queueEngine.setMode(mode);
    return {
      success: true,
      message: `System switched to ${mode.toUpperCase()} mode.`,
      modeInfo: updated
    };
  });

  // Reset Real Database to Clean State (for tests / fresh hospital rollout)
  fastify.post('/api/system/reset-real-data', async () => {
    queueEngine.resetRealData();
    return { success: true, message: "Real hospital database reset to 0 records." };
  });

  // Audit Logs
  fastify.get('/api/system/audit-logs', async (request) => {
    const { limit = 50 } = request.query;
    return {
      count: queueEngine.getAuditLogs(Number(limit)).length,
      logs: queueEngine.getAuditLogs(Number(limit))
    };
  });

  // System Backup & Disaster Recovery Export
  fastify.get('/api/system/backup', async () => {
    return queueEngine.getBackup();
  });

  // System Health & External Service Integrations Transparency
  fastify.get('/api/system/status', async () => {
    return {
      system: "DocBD Enterprise HealthTech Gateway",
      version: "1.0.0",
      operatingMode: queueEngine.getModeInfo(),
      externalServices: {
        smsGateway: {
          provider: config.smsProvider,
          status: config.smsProvider === 'mock' ? 'MOCK_SANDBOX (Console logs only - No telecom charges)' : 'LIVE_GATEWAY',
          isLiveReady: config.smsProvider !== 'mock'
        },
        paymentGateway: {
          provider: "bKash Tokenized + Manual Verification",
          status: "HYBRID_SANDBOX",
          manualVerificationSupported: true
        },
        databaseStorage: {
          engine: "Partitioned Flat File / Prisma-Ready",
          activeFile: queueEngine.activeDbPath,
          postgresSchemaReady: true
        }
      }
    };
  });
}

module.exports = systemRoutes;
