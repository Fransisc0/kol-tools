import type { Server } from 'node:http';
import { createApp } from './server/app';

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';
let server: Server | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  const app = await createApp();
  server = app.listen(port, host, () => {
    console.log(`TCRS API listening on ${host}:${port}`);
  });
}

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down.`);

  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();

  server?.close((error) => {
    clearTimeout(timeout);
    if (error) {
      console.error('Server shutdown failed.');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

start().catch(() => {
  console.error('Unable to start the TCRS API.');
  process.exit(1);
});
