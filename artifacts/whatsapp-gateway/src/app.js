'use strict';

const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all routes under /whatsapp prefix
app.use('/whatsapp', routes);

// Catch-all for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[Gateway] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
