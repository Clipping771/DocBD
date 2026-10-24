const queueEngine = require('../services/queueEngine');

async function queueRoutes(fastify, options) {
  // Live state
  fastify.get('/api/queue/live/:chamberId', async (request, reply) => {
    const { chamberId = 'ch-pop-302' } = request.params;
    const state = queueEngine.getChamberState(chamberId);
    if (!state) {
      return reply.code(404).send({ error: "Chamber not found" });
    }
    return state;
  });

  // Call next
  fastify.post('/api/queue/call-next', async (request) => {
    const { chamberId = 'ch-pop-302' } = request.body || {};
    return queueEngine.callNext(chamberId);
  });

  // Done
  fastify.post('/api/queue/done', async (request) => {
    const { chamberId = 'ch-pop-302' } = request.body || {};
    return queueEngine.completeVisit(chamberId);
  });

  // No-Show
  fastify.post('/api/queue/noshow', async (request) => {
    const { chamberId = 'ch-pop-302' } = request.body || {};
    return queueEngine.markNoShow(chamberId);
  });

  // Hold
  fastify.post('/api/queue/hold', async (request) => {
    const { chamberId = 'ch-pop-302' } = request.body || {};
    return queueEngine.holdPatient(chamberId);
  });

  // Verified Payment Recording
  fastify.post('/api/queue/record-payment', async (request, reply) => {
    const { 
      chamberId = 'ch-pop-302', 
      serialNumber, 
      amount, 
      method = 'CASH', 
      trxId = '', 
      receivedBy = 'কম্পাউন্ডার ডেস্ক' 
    } = request.body || {};

    if (!serialNumber) {
      return reply.code(400).send({ error: "Patient serial number is required." });
    }

    try {
      const result = queueEngine.recordPayment({
        chamberId,
        serialNumber: Number(serialNumber),
        amount,
        method,
        trxId,
        receivedBy
      });
      return result;
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // Clinical Vitals and Consultation Notes Entry
  fastify.post('/api/clinical/vitals', async (request, reply) => {
    const {
      chamberId = 'ch-pop-302',
      serialNumber,
      vitals = {},
      clinicalNotes = '',
      symptoms = ''
    } = request.body || {};

    try {
      const result = queueEngine.savePatientVitals({
        chamberId,
        serialNumber: serialNumber ? Number(serialNumber) : null,
        vitals,
        clinicalNotes,
        symptoms
      });
      return result;
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // Payment Toggle (Fast legacy toggle)
  fastify.post('/api/queue/payment-toggle', async (request) => {
    const { chamberId = 'ch-pop-302', serialNumber } = request.body || {};
    const updated = queueEngine.togglePayment(chamberId, serialNumber);
    return { success: true, serial: serialNumber, paid: updated.paid };
  });

  // Checkin Toggle
  fastify.post('/api/queue/checkin-toggle', async (request) => {
    const { chamberId = 'ch-pop-302', serialNumber } = request.body || {};
    const updated = queueEngine.toggleCheckin(chamberId, serialNumber);
    return { success: true, serial: serialNumber, checkin: updated.checkin };
  });

  // Patient Self Check-in
  fastify.post('/api/queue/checkin', async (request) => {
    const { chamberId = 'ch-pop-302', serialNumber } = request.body || {};
    const patient = queueEngine.checkIn(chamberId, serialNumber);
    return { success: true, message: `সিরিয়াল #${serialNumber} উপস্থিতি নিশ্চিত করা হয়েছে।`, patient };
  });

  // Broadcast Doctor Delay
  fastify.post('/api/queue/delay-broadcast', async (request) => {
    const { chamberId = 'ch-pop-302', delayMinutes = 30, reason } = request.body || {};
    return queueEngine.broadcastDelay(chamberId, delayMinutes, reason);
  });

  // Book Serial (Patient App & Compounder Walk-in)
  fastify.post('/api/serials/book', async (request, reply) => {
    const { chamberId = 'ch-pop-302', name, phone, source = 'online', fee = 1000, paid = false } = request.body || {};
    if (!name || !phone) {
      return reply.code(400).send({ error: "Name and Phone number are required." });
    }
    try {
      const newBooking = queueEngine.bookSerial({ chamberId, name, phone, source, fee, paid });
      return { success: true, booking: newBooking };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // WebSocket Live Stream
  fastify.get('/ws/queue', { websocket: true }, (connection, req) => {
    queueEngine.registerWsClient(connection.socket);
    const initialState = queueEngine.getChamberState('ch-pop-302');
    connection.socket.send(JSON.stringify({ 
      event: 'INITIAL_STATE', 
      data: initialState,
      modeInfo: queueEngine.getModeInfo()
    }));
  });
}

module.exports = queueRoutes;
