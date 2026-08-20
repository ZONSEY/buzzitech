export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailProvider {
  send(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    attachments?: EmailAttachment[],
  ): Promise<void>;
}
