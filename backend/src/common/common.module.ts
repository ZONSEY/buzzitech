import { Global, Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService, StorageModule],
  imports: [StorageModule],
})
export class CommonModule {}
