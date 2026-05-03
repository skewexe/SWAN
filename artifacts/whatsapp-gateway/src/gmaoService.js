'use strict';

const axios = require('axios');
const { config } = require('./config');

async function createWorkOrder({ description, phone, priority }) {
  const title = `[WhatsApp] ${description.substring(0, 80)}`;
  const response = await axios.post(`${config.gmaoApiUrl}/workorders`, {
    title,
    description: `Source: WhatsApp\nNuméro: +${phone}\n\n${description}`,
    status: 'open',
    priority: priority || 'medium',
    type: 'corrective',
    assignmentMode: 'by_type',
  }, { timeout: 8000 });
  return response.data;
}

async function getWorkOrder(id) {
  const response = await axios.get(`${config.gmaoApiUrl}/workorders/${id}`, { timeout: 8000 });
  return response.data;
}

module.exports = { createWorkOrder, getWorkOrder };
