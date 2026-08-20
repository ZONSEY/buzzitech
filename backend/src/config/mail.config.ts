import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM,
  adminEmail: process.env.ADMIN_EMAIL ?? process.env.SMTP_FROM,
}));
