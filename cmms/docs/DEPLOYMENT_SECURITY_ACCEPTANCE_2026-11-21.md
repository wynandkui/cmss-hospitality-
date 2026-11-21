# CMMS v1.2 — Deployment security acceptance checkpoint (2026-11-21)

## Verified in isolated testing
- 92 unit tests pass; 55 disposable MariaDB and real Chromium browser/API checks pass; static build succeeds.
- Role-based access is enforced for manager, supervisor, coordinator, finance administrator and technician workflows. Unauthorized writes and reads fail closed.
- Missing authentication returns 401, with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` on API responses.
- Forged cross-origin login is rejected (403), malformed JSON rejected (400).
- Session cookie includes HttpOnly, SameSite=Strict and Path=/api. Logout invalidates its session token.
- Revision conflicts return 409; writes generate audit and transaction records; disposable test database is removed.
- Default bind address is 127.0.0.1; production data and port 3002 were not modified.

## Release blockers / manual acceptance required
1. **HTTPS termination:** Configure trusted TLS reverse proxy and set `CMMS_HTTPS=true` only after confirming HTTPS works. Verify the `Secure` cookie attribute over the real HTTPS origin; not verified by local HTTP tests.
2. **Reverse-proxy trust boundary:** The origin comparison currently considers `X-Forwarded-Proto`. Restrict proxy headers to a trusted reverse proxy and test forged headers before internet exposure.
3. **Sessions and availability:** Session state is in-memory and is lost on restart; decide whether persistent/shared session storage is needed. Validate expiry and login throttling under real deployment.
4. **Database recovery:** Conduct an isolated restore of the current production backup, validate table counts, users, transactions, audit events and media references; record recovery time and checksum. The integration suite clones a known test database, not a production backup.
5. **Access/network:** Confirm firewall, backup encryption, service-account least privilege, secret-file mode 0600, OS updates, and protected media storage on deployment host.
6. **Operational sign-off:** Test administrator recovery, real user acceptance, incident rollback, monitoring and an approved change window before production promotion.

**Decision: NOT YET APPROVED FOR PRODUCTION.** This checkpoint covers automated security regression only, not a penetration test or completed deployment acceptance.
