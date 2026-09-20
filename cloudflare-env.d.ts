declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    WATCHDOG_INGEST_TOKEN?: string;
    BUCKET?: R2Bucket;
  }
}
