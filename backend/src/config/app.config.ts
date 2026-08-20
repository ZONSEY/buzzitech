import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  url: process.env.APP_URL,
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV,
  corsOrigin: process.env.CORS_ORIGIN,
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
}));
