const queueEngine = require('../services/queueEngine');

async function healthRoutes(fastify, options) {
  fastify.get('/api/health', async () => {
    return {
      status: 'UP',
      platform: 'DocBD Backend Engine',
      version: '1.0.0',
      connectedClients: queueEngine.wsClients.size,
      timestamp: new Date().toISOString()
    };
  });
}

module.exports = healthRoutes;
