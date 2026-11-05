import axios, { type AxiosInstance } from 'axios';
import type {
  User,
  Phone,
  Message,
  MessageThread,
  Contact,
  PhoneApiKey,
  DashboardStats,
} from '../types';

export const DEFAULT_SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : `${window.location.protocol}//${window.location.host}`;

export function getStoredServerUrl(): string {
  return localStorage.getItem('ctpsms_server_url') || DEFAULT_SERVER_URL;
}

export function setStoredServerUrl(url: string) {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
  localStorage.setItem('ctpsms_server_url', cleaned);
}

export function getStoredApiKey(): string {
  return localStorage.getItem('ctpsms_api_key') || '';
}

export function setStoredApiKey(key: string) {
  localStorage.setItem('ctpsms_api_key', key.trim());
}

export function clearStoredAuth() {
  localStorage.removeItem('ctpsms_api_key');
}

// Create configured Axios instance
export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: getStoredServerUrl(),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    config.baseURL = getStoredServerUrl();
    const apiKey = getStoredApiKey();
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    return config;
  });

  return instance;
}

export const api = createApiClient();

// Strongly typed API services
export const ApiService = {
  // Test connection & health
  async checkHealth(targetUrl?: string) {
    const url = targetUrl ? targetUrl.replace(/\/$/, '') : getStoredServerUrl();
    const res = await axios.get(`${url}/health`, { timeout: 6000 });
    return res.data;
  },

  // Auth & Profile
  async getMe(): Promise<{ status: string; data: User }> {
    const res = await api.get('/v1/users/me');
    return res.data;
  },

  async login(apiKey: string): Promise<{ status: string; data: User }> {
    const res = await api.post('/v1/users/login', { apiKey });
    return res.data;
  },

  async updateUser(data: Partial<User>): Promise<{ status: string; data: User }> {
    const res = await api.put('/v1/users/me', data);
    return res.data;
  },

  async rotateApiKey(): Promise<{ status: string; data: { api_key: string } }> {
    const res = await api.post('/v1/users/rotate-api-key');
    return res.data;
  },

  // Stats
  async getStats(): Promise<{ status: string; data: DashboardStats }> {
    const res = await api.get('/v1/stats');
    return res.data;
  },

  // Phones
  async getPhones(): Promise<{ status: string; data: Phone[] }> {
    const res = await api.get('/v1/phones');
    return res.data;
  },

  async registerPhone(data: {
    phoneNumber: string;
    sim?: string;
    messagesPerMinute?: number;
    maxSendAttempts?: number;
    messageExpirationSeconds?: number;
    fcmToken?: string;
  }): Promise<{ status: string; data: Phone }> {
    const res = await api.put('/v1/phones', data);
    return res.data;
  },

  async deletePhone(phoneId: string): Promise<{ status: string; message: string }> {
    const res = await api.delete(`/v1/phones/${phoneId}`);
    return res.data;
  },

  // Messages
  async getMessages(params?: {
    owner?: string;
    contact?: string;
    status?: string;
    query?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ status: string; total: number; data: Message[] }> {
    const res = await api.get('/v1/messages', { params });
    return res.data;
  },

  async sendMessage(data: {
    to: string;
    content: string;
    from?: string;
    sim?: string;
  }): Promise<{ status: string; data: Message; message: string }> {
    const res = await api.post('/v1/messages/send', data);
    return res.data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/v1/messages/${messageId}`);
  },

  // Message Threads
  async getThreads(params?: {
    owner?: string;
    query?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ status: string; total: number; data: MessageThread[] }> {
    const res = await api.get('/v1/message-threads', { params });
    return res.data;
  },

  async deleteThread(threadId: string): Promise<void> {
    await api.delete(`/v1/message-threads/${threadId}`);
  },

  // Contacts
  async getContacts(params?: {
    query?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
  }): Promise<{ status: string; total: number; data: Contact[] }> {
    const res = await api.get('/v1/contacts', { params });
    return res.data;
  },

  async createContact(data: {
    name: string;
    phone_numbers: string[];
    emails?: string[];
    properties?: Record<string, any>;
  }): Promise<{ status: string; data: Contact }> {
    const res = await api.post('/v1/contacts', data);
    return res.data;
  },

  async uploadContacts(contacts: Array<{
    name: string;
    phone_numbers: string[];
    emails?: string[];
  }>): Promise<{ status: string; data: Contact[] }> {
    const res = await api.post('/v1/contacts/upload', { contacts });
    return res.data;
  },

  async deleteContact(contactId: string): Promise<void> {
    await api.delete(`/v1/contacts/${contactId}`);
  },

  // Phone API Keys
  async getPhoneApiKeys(): Promise<{ status: string; data: PhoneApiKey[] }> {
    const res = await api.get('/v1/phone-api-keys');
    return res.data;
  },

  async createPhoneApiKey(data: {
    name: string;
    phone_numbers?: string[];
  }): Promise<{ status: string; data: PhoneApiKey }> {
    const res = await api.post('/v1/phone-api-keys', data);
    return res.data;
  },

  async deletePhoneApiKey(keyId: string): Promise<void> {
    await api.delete(`/v1/phone-api-keys/${keyId}`);
  },
};
