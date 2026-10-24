// DocBD Modular Fastify Production Server & Live Gateway
const path = require('path');
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const fastifyStatic = require('@fastify/static');

const config = require('./config');

// Route Modules
const healthRoutes = require('./routes/healthRoutes');
const systemRoutes = require('./routes/systemRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const queueRoutes = require('./routes/queueRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const smsRoutes = require('./routes/smsRoutes');

async function startServer() {
  // 1. Plugins
  await fastify.register(cors, config.cors);
  await fastify.register(websocket);

  // Serve static frontend assets
  const clientDir = path.resolve(__dirname, '../../client');
  const rootDir = path.resolve(__dirname, '../../');
  
  // Serve from client folder, with fallback to root for legacy compatibility
  await fastify.register(fastifyStatic, {
    root: [clientDir, rootDir],
    prefix: '/',
    decorateReply: false
  });

  // 2. Register Modular Routes
  await fastify.register(healthRoutes);
  await fastify.register(systemRoutes);
  await fastify.register(hospitalRoutes);
  await fastify.register(doctorRoutes);
  await fastify.register(queueRoutes);
  await fastify.register(prescriptionRoutes);
  await fastify.register(smsRoutes);

  // 3. Direct Role-Specific SPA Routes
  const roleRoutes = ['/patient', '/doctor', '/serial', '/compounder', '/reception', '/hospital', '/admin', '/superadmin', '/tv', '/dual', '/roles'];
  roleRoutes.forEach(r => {
    fastify.get(r, (req, reply) => {
      reply.sendFile('index.html');
    });
  });

  // 3. Listen
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`\n======================================================`);
    console.log(`🚀 DocBD Modular Production Server: http://localhost:${config.port}`);
    console.log(`📱 Client App Served: http://localhost:${config.port}/`);
    console.log(`📡 WebSocket Gateway: ws://localhost:${config.port}/ws/queue`);
    console.log(`======================================================\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
