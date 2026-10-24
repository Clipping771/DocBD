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

  // Chambers summary for central OPD monitoring
  fastify.get('/api/chambers/summary', async () => {
    return { chambers: queueEngine.getAllChambersSummary() };
  });

  // Live Hospital Analytics derived from actual database records
  fastify.get('/api/hospital/analytics', async () => {
    return queueEngine.getHospitalAnalytics();
  });

  // Waiting Room TV Signage (Strict Privacy Enforcement)
  fastify.get('/api/tv/signage', async () => {
    return queueEngine.getTvSignageState();
  });
}

module.exports = hospitalRoutes;
