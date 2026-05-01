# Local infrastructure

## Keycloak (`docker-compose.yml`)

The `keycloak` service uses PostgreSQL (`keycloak-db`) and imports the dev realm from `keycloak/topcv.json` on first startup (`start --import-realm`).

### Admin console

- URL: `http://localhost:8080`
- Bootstrap admin (Keycloak 24+): set via `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` in Compose (defaults: `admin` / `admin` — change for anything beyond local dev).
- Older Keycloak / Quarkus images often documented `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` for the first admin user; current images prefer `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` (what this repo uses).

### Realm `topcv`

- Issuer: `http://localhost:8080/realms/topcv`
- Public client: `topcv-api` (authorization code + direct access grants for local testing).
- Registration: enabled (dev-only) so the FE `/register` flow can open the Keycloak sign-up screen.
- Roles: realm roles `admin`, `staff`; same names as **client roles** on `topcv-api`. The Nest verifier merges `realm_access.roles` with `resource_access["topcv-api"].roles` when `KEYCLOAK_CLIENT_ID=topcv-api`.
- Sample users (passwords are dev-only; rotate or delete outside localhost):

| Username   | Password   | Notes                                      |
| ---------- | ---------- | ------------------------------------------ |
| `dev-admin` | `dev-admin` | realm `admin` + client `admin` on `topcv-api` |
| `dev-staff` | `dev-staff` | realm `staff` + client `staff` on `topcv-api`  |

### Re-importing the realm

Imports run at startup when the DB volume is empty or the realm is missing. To force a clean import, remove the `keycloak_db_data` volume and restart the `keycloak` + `keycloak-db` services.
