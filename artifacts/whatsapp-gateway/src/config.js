'use strict';

const config = {
  port: parseInt(process.env.PORT || '8099', 10),
  gmaoApiUrl: process.env.GMAO_API_URL || 'http://localhost:8080/api',
};

module.exports = { config };
