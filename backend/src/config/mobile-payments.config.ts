import { registerAs } from '@nestjs/config';

export default registerAs('mobilePayments', () => ({
  orangeMoney: {
    apiUrl: process.env.ORANGE_MONEY_API_URL,
    clientId: process.env.ORANGE_MONEY_CLIENT_ID,
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET,
    merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY,
  },
  wave: {
    apiUrl: process.env.WAVE_API_URL,
    apiKey: process.env.WAVE_API_KEY,
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET,
  },
  paydunya: {
    apiUrl: process.env.PAYDUNYA_API_URL,
    masterKey: process.env.PAYDUNYA_MASTER_KEY,
    privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
    publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
    token: process.env.PAYDUNYA_TOKEN,
  },
}));
