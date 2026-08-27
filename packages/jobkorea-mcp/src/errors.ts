export class JobKoreaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobKoreaConfigError";
  }
}

export class JobKoreaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "JobKoreaApiError";
  }
}
