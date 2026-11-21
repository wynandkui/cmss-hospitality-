# Gate 26 isolated HTTPS staging — preparation, not deployed

The application must bind `CMMS_BIND=127.0.0.1` and run with `CMMS_HTTPS=true` and `CMMS_ALLOWED_HOSTS=localhost:8443` behind an approved local TLS terminator. Nginx `nginx.conf` is a **staging reference only**. The upstream `127.0.0.1:3097` assumes Nginx runs on the **same host/network namespace** as the disposable API; it will not work unchanged in a separate Docker container. For container deployment, use an internal network service name, not a published upstream port.

Use a short-lived locally generated certificate for test only. Never commit private keys or expose the staging service to a public interface. Validate `nginx -t`, TLS handshake, trusted Host rejection, HTTP-origin rejection, `Secure; HttpOnly; SameSite=Strict` cookies and direct access prevention. Replace `localhost` and ports only with explicitly approved staging names. Avoid HSTS on production until certificate and redirect policy are approved.

**Status:** Actual Nginx TLS deployment and end-to-end handshake have **not** been executed. Do not interpret passing application HTTPS-mode tests as proof of transport security. Gate 26 remains open.
