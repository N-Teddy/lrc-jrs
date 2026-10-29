export class Logger {
  static log(message: string) {
    console.log(`[api-endpoint-tester] ${message}`);
  }

  static error(message: string, error?: unknown) {
    console.error(`[api-endpoint-tester] ${message}`, error ?? '');
  }
}
