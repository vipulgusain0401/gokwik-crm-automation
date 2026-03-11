export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    console.log(`[INFO] [${this.context}] ${new Date().toISOString()} - ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] [${this.context}] ${new Date().toISOString()} - ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] [${this.context}] ${new Date().toISOString()} - ${message}`);
    if (error) {
      console.error(error.stack);
    }
  }

  step(stepName: string): void {
    console.log(`\n▶ [STEP] [${this.context}] ${stepName}`);
  }
}
