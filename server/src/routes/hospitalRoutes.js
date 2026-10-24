const { HOSPITALS } = require('../data/seedData');
const queueEngine = require('../services/queueEngine');

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(2));
}

async function hospitalRoutes(fastify, options) {
  // GPS Geospatial Hospital Search
  fastify.get('/api/hospitals/nearby', async (request) => {
    const { lat = 23.7461, lng = 90.3742, radiusKm = 15 } = request.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const withDistance = HOSPITALS.map(h => ({
      ...h,
      distanceKm: calculateDistanceKm(userLat, userLng, h.latitude, h.longitude),
      estTravelTimeMinutes: Math.round(calculateDistanceKm(userLat, userLng, h.latitude, h.longitude) * 6)
    })).filter(h => h.distanceKm <= parseFloat(radiusKm));

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return { count: withDistance.length, hospitals: withDistance };
  });

  // Public & Multi-tenant Hospitals Directory
  fastify.get('/api/hospitals', async () => {
    const list = queueEngine.getHospitals();
    return { count: list.length, hospitals: list };
  });

  // Specific Hospital Details
  fastify.get('/api/hospitals/:hospitalId', async (request, reply) => {
    const { hospitalId } = request.params;
    const hospital = queueEngine.getHospitalById(hospitalId);
    if (!hospital) return reply.code(404).send({ error: "Hospital not found" });
    return hospital;
  });

  // Hospital-Specific Doctors
  fastify.get('/api/hospitals/:hospitalId/doctors', async (request) => {
    const { hospitalId } = request.params;
    const docs = queueEngine.getDoctorDirectory(hospitalId);
    return { count: docs.length, hospitalId, doctors: docs };
  });

  // Hospital Admin onboards doctor to their specific hospital
  fastify.post('/api/hospitals/:hospitalId/doctors', async (request, reply) => {
    const { hospitalId } = request.params;
    try {
      const chamber = queueEngine.addDoctorToHospital(hospitalId, request.body || {});
      return { success: true, chamber };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // System Super Admin: Create a new Hospital & assign its Hospital Admin
  fastify.post('/api/system/hospitals', async (request, reply) => {
    try {
      const hospital = queueEngine.createHospital(request.body || {});
      return { success: true, hospital };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // System Super Admin: Update/Assign Hospital Admin
  fastify.post('/api/system/hospital-admins', async (request, reply) => {
    const { hospitalId, adminName, adminEmail, adminPhone } = request.body || {};
    try {
      const updated = queueEngine.updateHospitalAdmin(hospitalId, { adminName, adminEmail, adminPhone });
      return { success: true, hospital: updated };
    } catch (e) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // System Super Admin: Global Platform Metrics
  fastify.get('/api/system/super-metrics', async () => {
    return queueEngine.getSuperAdminMetrics();
  });

  // Chambers summary for central OPD monitoring
  fastify.get('/api/chambers/summary', async () => {
    return { chambers: queueEngine.getAllChambersSummary() };
  });

  // Live Hospital Analytics derived from actual database records
  fastify.get('/api/hospital/analytics', async (request) => {
    const { hospitalId } = request.query || {};
    return queueEngine.getHospitalAnalytics(hospitalId);
  });

  // Waiting Room TV Signage (Strict Privacy Enforcement)
  fastify.get('/api/tv/signage', async () => {
    return queueEngine.getTvSignageState();
  });
}

module.exports = hospitalRoutes;
