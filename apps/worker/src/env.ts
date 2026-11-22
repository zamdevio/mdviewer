export type Env = {
  R2_BUCKET: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;
  /** Comma-separated list of allowed origins for CORS + share URL construction */
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_WINDOW?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
};
