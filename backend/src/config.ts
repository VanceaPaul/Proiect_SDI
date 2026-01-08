import dotenv from 'dotenv';

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const config = {
  port: numberFromEnv(process.env.PORT, 4000),
  apiKey: process.env.SIGNALING_API_KEY || 'dev-api-key',
  sqlitePath: process.env.SQLITE_PATH || './data/messages.sqlite',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  turn: {
    url: process.env.TURN_SERVER_URL || '',
    username: process.env.TURN_SERVER_USERNAME || '',
    credential: process.env.TURN_SERVER_PASSWORD || ''
  }
};
