const smsService = require('../services/smsService');

async function smsRoutes(fastify, options) {
  fastify.get('/api/sms/logs', async () => {
    return { logs: smsService.getLogs() };
  });
}

module.exports = smsRoutes;
