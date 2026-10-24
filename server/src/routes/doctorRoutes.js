const queueEngine = require('../services/queueEngine');

async function doctorRoutes(fastify, options) {
  // Get active doctors directory (dynamic from active storage, filterable by hospital)
  fastify.get('/api/doctors', async (request) => {
    const { specialty, query, hospitalId } = request.query || {};
    let list = queueEngine.getDoctorDirectory(hospitalId);

    if (specialty && specialty !== 'all') {
      const s = specialty.toLowerCase();
      list = list.filter(d => 
        (d.spec && d.spec.toLowerCase().includes(s)) ||
        (d.dept && d.dept.toLowerCase() === s)
      );
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.spec.toLowerCase().includes(q) ||
        d.bmdc.toLowerCase().includes(q)
      );
    }

    return {
      count: list.length,
      isDemo: queueEngine.mode === 'demo',
      mode: queueEngine.mode,
      doctors: list
    };
  });

  // Onboard / Register a Real Doctor & Chamber
  fastify.post('/api/doctors/register', async (request, reply) => {
    const {
      name,
      bmdcRegNo,
      degrees,
      specialty,
      hospitalName,
      roomNumber,
      fee,
      followupFee,
      schedules
    } = request.body || {};

    if (!name || !bmdcRegNo || !specialty) {
      return reply.code(400).send({
        error: "Doctor name, BMDC Registration number, and Specialty are mandatory."
      });
    }

    try {
      const newChamber = queueEngine.addDoctorAndChamber({
        name,
        bmdcRegNo,
        degrees,
        specialty,
        hospitalName,
        roomNumber,
        fee,
        followupFee,
        schedules
      });

      return {
        success: true,
        message: `ডা. ${name} সফলভাবে নিবন্ধিত হয়েছেন।`,
        chamber: newChamber
      };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });
}

module.exports = doctorRoutes;
