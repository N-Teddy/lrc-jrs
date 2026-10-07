export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string | string[],
    public readonly path?: string,
  ) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'ApiError';
  }
}
