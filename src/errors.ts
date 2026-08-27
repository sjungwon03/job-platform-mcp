export class SaraminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaraminConfigError";
  }
}

export class SaraminApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: number,
  ) {
    super(message);
    this.name = "SaraminApiError";
  }
}
