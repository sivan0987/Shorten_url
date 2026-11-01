// Errors the business logic can raise. Each one knows which HTTP status it means,
// so the error-handler middleware can turn it into the right response.

export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class InvalidUrlError extends AppError {
  constructor() {
    super(400, "Invalid URL");
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super(404, "Link not found");
  }
}

export class LinkExpiredError extends AppError {
  constructor() {
    super(410, "Link expired");
  }
}

export class NoKeysAvailableError extends AppError {
  constructor() {
    super(503, "No keys available");
  }
}
