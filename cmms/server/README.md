# MariaDB server

Requires Node.js 20+, MariaDB 10.6+ and `mysql2` (`npm install`). Run `npm run server`. Do **not** expose the HTTP server directly to the Internet. Configure a reverse proxy with HTTPS and set `CMMS_HTTPS=true` when TLS terminates at the proxy.

Use the least-privileged MariaDB account. The server creates tables automatically inside an **existing database**. Store `.env` outside Git and protect the media folder. Technicians may edit progress on work orders assigned to their linked person record; administrators manage setup, accounts and attachments.

The MariaDB mode stores shared application state as a versioned JSON document (optimistic concurrency). Concurrent updates are rejected rather than silently overwriting another user's work. It is a practical small-team implementation, not a fully normalized, high-throughput enterprise database. Sessions are held in server memory and expire after eight hours; a server restart logs everyone out. Uploaded files are stored on the server filesystem and their metadata in MariaDB. Back up both together.