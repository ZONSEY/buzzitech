import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  subject!: string;

  @IsString()
  template!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsObject()
  attachments?: EmailAttachment[];
}
