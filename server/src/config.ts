import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/classroom_simulator',
};
