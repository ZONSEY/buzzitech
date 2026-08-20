import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  APP_NAME: Joi.string().default('Buzzitech API'),

  APP_URL: Joi.string().uri().required(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),

  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  JWT_EXPIRES_IN: Joi.string().default('15m'),

  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Swagger
  ENABLE_SWAGGER: Joi.boolean().default(true),

  // SMTP
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM: Joi.string().email().required(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  // Orange Money, Wave, PayDunya : optionnels tant que ces moyens de
  // paiement ne sont pas activés (structure prête, comptes marchands à
  // créer séparément). Un checkout sur un gateway non configuré échoue
  // proprement à l'appel de l'API plutôt qu'au démarrage du serveur.
  ORANGE_MONEY_API_URL: Joi.string().uri().optional(),
  ORANGE_MONEY_CLIENT_ID: Joi.string().optional(),
  ORANGE_MONEY_CLIENT_SECRET: Joi.string().optional(),
  ORANGE_MONEY_MERCHANT_KEY: Joi.string().optional(),

  WAVE_API_URL: Joi.string().uri().default('https://api.wave.com'),
  WAVE_API_KEY: Joi.string().optional(),
  WAVE_WEBHOOK_SECRET: Joi.string().optional(),

  PAYDUNYA_API_URL: Joi.string()
    .uri()
    .default('https://app.paydunya.com/api/v1'),
  PAYDUNYA_MASTER_KEY: Joi.string().optional(),
  PAYDUNYA_PRIVATE_KEY: Joi.string().optional(),
  PAYDUNYA_PUBLIC_KEY: Joi.string().optional(),
  PAYDUNYA_TOKEN: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Upload
  UPLOAD_MAX_SIZE: Joi.number().default(10485760),
});
