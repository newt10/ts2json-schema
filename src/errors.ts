export class GeneratorError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

export class FileWriteError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileWriteError';
  }
}

export class JSONBuilderError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'JSONBuilderError';
  }
}