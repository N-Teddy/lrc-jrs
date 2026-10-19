export interface NotificationStrategy {
  readonly channel: 'whatsapp' | 'email';
  send(
    recipient: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<boolean>;
}
