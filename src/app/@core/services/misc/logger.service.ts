/**
 * Simple logger service for development
 */
export class Logger {
  constructor(private source?: string) {}

  debug(...args: any[]) {
    if (console && console.log) {
      const prefix = this.source ? `[${this.source}]` : '';
      console.log(prefix, ...args);
    }
  }

  info(...args: any[]) {
    if (console && console.info) {
      const prefix = this.source ? `[${this.source}]` : '';
      console.info(prefix, ...args);
    }
  }

  warn(...args: any[]) {
    if (console && console.warn) {
      const prefix = this.source ? `[${this.source}]` : '';
      console.warn(prefix, ...args);
    }
  }

  error(...args: any[]) {
    if (console && console.error) {
      const prefix = this.source ? `[${this.source}]` : '';
      console.error(prefix, ...args);
    }
  }
}

