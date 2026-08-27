export class WantedConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WantedConfigError";
  }
}

export class WantedApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "WantedApiError";
  }
}
