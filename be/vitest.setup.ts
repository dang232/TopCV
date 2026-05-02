/**
 * CI and local Vitest runs often have no `.env`. `ConfigModule` validates required vars at bootstrap.
 * Set safe placeholders only when missing so `AppModule` tests and e2e-style specs can compile.
 */
function setIfMissing(key: string, value: string): void {
  const v = process.env[key];
  if (v === undefined || v === '') {
    process.env[key] = value;
  }
}

setIfMissing('NODE_ENV', 'test');

setIfMissing('MONGODB_URL', 'mongodb://127.0.0.1:27017');
setIfMissing('MONGODB_DB_NAME', 'topcv_test');
setIfMissing('REDIS_URL', 'redis://127.0.0.1:6379');
setIfMissing('ELASTICSEARCH_URL', 'http://127.0.0.1:9200');

setIfMissing('KEYCLOAK_ISSUER', 'http://127.0.0.1:8080/realms/test');
setIfMissing('KEYCLOAK_CLIENT_ID', 'test-client');
setIfMissing('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli');
setIfMissing('KEYCLOAK_ADMIN_CLIENT_SECRET', 'test-admin-secret');
