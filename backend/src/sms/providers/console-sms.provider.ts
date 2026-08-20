import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../interfaces/sms-provider.interface';

// Stub sans fournisseur réel : journalise l'envoi au lieu d'appeler une
// API SMS payante (Twilio, Orange SMS API...). À remplacer par une
// implémentation réelle de SmsProvider (voir OrangeMoneyProvider pour
// le patron d'intégration d'une API tierce) le jour où un fournisseur
// SMS est choisi — aucun autre fichier n'a besoin de changer, seul le
// provider injecté dans SmsModule change.
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  send(to: string, message: string): Promise<void> {
    this.logger.log(`[SMS simulé] → ${to} : ${message}`);
    return Promise.resolve();
  }
}
