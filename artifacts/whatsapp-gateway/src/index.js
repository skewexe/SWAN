'use strict';

const app = require('./app');
const { initClient } = require('./whatsapp');
const { config } = require('./config');

const port = config.port;

app.listen(port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║        SWAN GMAO — WhatsApp Gateway       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Service running on port ${port}`);
  console.log(`  GMAO API: ${config.gmaoApiUrl}`);
  console.log(`  Status:   http://localhost:${port}/whatsapp/status`);
  console.log(`  Admin UI: http://localhost:${port}/whatsapp/healthz`);
  console.log('');
  console.log('[Gateway] Starting WhatsApp client in background...');
  setImmediate(() => {
    initClient().catch((error) => {
      console.error('[Gateway] WhatsApp client failed to start:', error.message);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('[Gateway] Shutting down gracefully...');
  process.exit(0);
});
