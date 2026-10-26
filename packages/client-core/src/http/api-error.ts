export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string | string[],
    public readonly path?: string,
    public readonly errorCode?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'ApiError';
  }
}
