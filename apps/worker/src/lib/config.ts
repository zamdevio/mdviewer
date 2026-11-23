/**
 * Operator-tunable Worker caps. Self-host: edit + redeploy.
 * SPA/BYO clients should read GET /compatibility (`ttl`, `limits`) instead of hardcoding.
 */

/** Fixed TTL — expiresAt set once at create, never slid. */
export const TTL_DEFAULT_SECONDS = 7 * 24 * 60 * 60;
export const TTL_MAX_SECONDS = 30 * 24 * 60 * 60;
export const TTL_MIN_SECONDS = 60;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Max share ids per POST /share/rotate-manage */
export const ROTATE_MANAGE_MAX_IDS = 50;

/** Fair-use defaults (env RATE_LIMIT_WINDOW / RATE_LIMIT_MAX_REQUESTS override). */
export const FAIR_USE_WINDOW_SECONDS = 60;
export const FAIR_USE_MAX_REQUESTS = 10;
export const FAIR_USE_AGENT_MAX_REQUESTS = 3;
