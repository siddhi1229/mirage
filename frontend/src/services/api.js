import axios from 'axios';

export const createApiClient = (backendUrl) => {
  return axios.create({
    baseURL: backendUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000
  });
};

export const apiFunctions = {
  chat: async (client, userId, prompt) => {
    return client.post('/api/chat', 
      { prompt },
      {
        headers: { 'X-User-ID': userId }
      }
    );
  },

  getSessions: async (client) => {
    return client.get('/api/sessions');
  },

  getLogs: async (client) => {
    return client.get('/api/logs');
  },

  getAudit: async (client) => {
    return client.get('/api/blockchain/status');
  },

  getStats: async (client) => {
    return client.get('/admin/stats');
  },

  health: async (client) => {
    return client.get('/health');
  }
};
