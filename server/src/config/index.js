// DocBD Server Configuration
module.exports = {
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  cors: {
    origin: true
  },
  smsProvider: process.env.SMS_PROVIDER || 'mock'
};
