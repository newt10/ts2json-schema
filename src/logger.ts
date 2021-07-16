export const enum LogLevel {
  ERROR,
  WARN,
  INFO,
  DEBUG,
  VERBOSE
}

export class Logger {
  public readonly logLevel: LogLevel;

  private _log: (message?: string, ...optionalParams: unknown[]) => void;
  private static errorPrefix = '\x1b[31m[ERR]\x1b[0m ';
  private static warnPrefix = '\x1b[33m[WARN]\x1b[0m ';
  private static infoPrefix = '\x1b[32m[INFO]\x1b[0m ';
  private static debugPrefix = '\x1b[37m[DBG]\x1b[0m ';
  private static verbosePrefix = '\x1b[37m[VRBS]\x1b[0m ';


  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(level: LogLevel = LogLevel.WARN, log: (message?: string, ...optionalParams: unknown[]) => void = () => { }) {
    this._log = log;
    this.logLevel = level;
  }

  info(message?: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.INFO, message, ...optionalParams);

  }

  debug(message?: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.DEBUG, message, ...optionalParams);

  }

  error(message?: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.ERROR, message, ...optionalParams);

  }

  warn(message?: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  verbose(message?: string, ...optionalParams: unknown[]) {
    this.log(LogLevel.VERBOSE, message, ...optionalParams);
  }

  log(level: LogLevel, message?: string, ...optionalParams: unknown[]) {
    if (!message || level > this.logLevel) {
      return;
    }
    switch (level) {
      case LogLevel.VERBOSE:
        this._log(Logger.verbosePrefix + message, ...optionalParams);
        break;
      case LogLevel.DEBUG:
        this._log(Logger.debugPrefix + message, ...optionalParams!);
        break;
      case LogLevel.INFO:
        this._log(Logger.infoPrefix + message, ...optionalParams);
        break;
      case LogLevel.WARN:
        this._log(Logger.warnPrefix + message, ...optionalParams);
        break;
      case LogLevel.ERROR:
        this._log(Logger.errorPrefix + message, ...optionalParams);
        break;
    }
  }
}