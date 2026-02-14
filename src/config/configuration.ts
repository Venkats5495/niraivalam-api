export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiration: process.env.JWT_EXPIRATION || '24h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@system.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
});
