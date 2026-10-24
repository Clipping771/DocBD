const queueEngine = require('../services/queueEngine');

async function prescriptionRoutes(fastify, options) {
  // Issue Digital Prescription
  fastify.post('/api/prescriptions/issue', async (request, reply) => {
    const { 
      chamberId = 'ch-pop-302',
      serial,
      patientName,
      patientPhone,
      docName,
      diagnosis,
      medications,
      tests,
      followupDate = "২০২৬-১০-৩০"
    } = request.body || {};

    try {
      const prescription = queueEngine.savePrescription({
        chamberId,
        serial,
        patientName,
        patientPhone,
        docName,
        diagnosis,
        medications,
        tests,
        followupDate
      });

      return {
        success: true,
        prescription,
        message: "ডিজিটাল প্রেসক্রিপশন সংরক্ষিত হয়েছে এবং রোগীকে SMS নোটিফিকেশন পাঠানো হয়েছে।"
      };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // Get Prescriptions for Patient Vault (Authorized by Phone or Name)
  fastify.get('/api/prescriptions', async (request) => {
    const { phone, patientName, query } = request.query;
    const searchTarget = phone || patientName || query;
    return { 
      count: queueEngine.getPrescriptions(searchTarget).length,
      prescriptions: queueEngine.getPrescriptions(searchTarget) 
    };
  });
}

module.exports = prescriptionRoutes;
